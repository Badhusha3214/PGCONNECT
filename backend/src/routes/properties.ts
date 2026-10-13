import { Hono, type Context } from 'hono'
import { cache } from 'hono/cache'
import { getSupabase } from '../lib/supabase'
import { authMiddleware, requireRole } from '../middleware/auth'
import { uploadToR2, deleteFromR2 } from '../lib/r2'
import { normalizeCity, cityVariants } from '../lib/city'
import { orSafe } from '../lib/postgrest'
import { nowIso } from '../lib/listing'
import type { Env } from '../types'

export const propertiesRouter = new Hono<Env>()

// Public, unauthenticated, identical response for everyone hitting the same
// URL — safe to edge-cache. Never apply this to an authenticated route: the
// cache key is just the URL, so it would leak one user's response to another.
const publicCache = cache({ cacheName: 'pgcon-properties', cacheControl: 'public, max-age=30' })

const MAX_PAGE_SIZE = 100
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Must match the property_rooms.type / bookings.room_type CHECK constraints
// (migration 006) and ROOM_TYPES in client/src/lib/listing.js.
const ROOM_TYPES = ['Single', 'Double', 'Triple', '4 Sharing', '5+ Sharing']

type RoomInput = { id?: string; type: string; price: number; total_beds: number; available_beds?: number; description?: string }

// Returns a message if the rooms can't be saved, else null.
const roomProblem = (list: RoomInput[]): string | null => {
  if (!Array.isArray(list) || list.length === 0) return 'Add at least one room type'
  for (const r of list) {
    const total = Number(r.total_beds)
    if (!ROOM_TYPES.includes(r.type) || !(Number(r.price) > 0) || !(Number.isInteger(total) && total >= 1)) {
      return `Each room needs a type (${ROOM_TYPES.join(', ')}), a price and at least 1 bed`
    }
    if (r.available_beds !== undefined) {
      const available = Number(r.available_beds)
      if (!Number.isInteger(available) || available < 0 || available > total) {
        return `Available beds for the ${r.type} room must be between 0 and ${total}`
      }
    }
  }
  if (new Set(list.map((r) => r.type)).size !== list.length) {
    return 'Each room type can only be added once — change its bed count instead'
  }
  return null
}

type BedRow = { id: string; label: string; status: string; current_booking_id: string | null }

// A bed is "held" when PGCON itself has it: reserved during checkout, on
// notice, or occupied by a PGCON booking. Owners can't change those.
const isHeld = (b: BedRow) =>
  b.status === 'locked' || b.status === 'notice-period' || (b.status === 'occupied' && Boolean(b.current_booking_id))

// Make a room have `total` beds of which `available` are vacant. Beds held by
// PGCON stay as they are; the rest are vacant or marked occupied by tenants
// who arranged their stay directly with the owner (occupied, no booking).
// The beds sync trigger then derives the room/property bed counts.
const syncRoomBeds = async (
  supabase: ReturnType<typeof getSupabase>,
  roomId: string,
  propertyId: string,
  total: number,
  available: number
) => {
  const { data } = await supabase.from('beds').select('id, label, status, current_booking_id').eq('room_id', roomId)
  const beds = (data ?? []) as BedRow[]
  const heldCount = beds.filter(isHeld).length
  let pool = beds.filter((b) => !isHeld(b))
  const poolSize = Math.max(total - heldCount, 0)

  if (pool.length > poolSize) {
    const extra = pool.slice(poolSize)
    pool = pool.slice(0, poolSize)
    await supabase.from('beds').delete().in('id', extra.map((b) => b.id))
  } else if (pool.length < poolSize) {
    const labels = new Set(beds.map((b) => b.label))
    const inserts: Array<{ room_id: string; property_id: string; label: string }> = []
    for (let n = 1; inserts.length < poolSize - pool.length; n++) {
      if (!labels.has(`Bed ${n}`)) inserts.push({ room_id: roomId, property_id: propertyId, label: `Bed ${n}` })
    }
    const { data: added } = await supabase.from('beds').insert(inserts).select('id, label, status, current_booking_id')
    pool = [...pool, ...((added ?? []) as BedRow[])]
  }

  // Change as few beds as possible to reach the requested availability.
  const vacant = pool.filter((b) => b.status === 'vacant')
  const offline = pool.filter((b) => b.status !== 'vacant')
  const target = Math.min(available, pool.length)
  if (vacant.length > target) {
    await supabase.from('beds').update({ status: 'occupied' }).in('id', vacant.slice(target).map((b) => b.id))
  } else if (vacant.length < target) {
    await supabase.from('beds').update({ status: 'vacant' }).in('id', offline.slice(0, target - vacant.length).map((b) => b.id))
  }
}

const MAX_PHOTOS = 10
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const PHOTO_FILE_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/

type Ctx = Context<Env>

// Returns an error message if this batch of photos can't be accepted.
const photoProblem = (files: File[], alreadyStored = 0): string | null => {
  if (files.length + alreadyStored > MAX_PHOTOS) return `A PG can have up to ${MAX_PHOTOS} photos`
  const bad = files.find((f) => !PHOTO_TYPES[f.type] || f.size > MAX_PHOTO_BYTES)
  return bad ? `"${bad.name}" must be a JPG, PNG or WebP image under 5 MB` : null
}

// Uploads photos to R2 and records them; they're served back through
// GET /images/:propertyId/:file, which is what image_url points at.
const storePhotos = async (c: Ctx, propertyId: string, files: File[], startPosition: number) => {
  const origin = new URL(c.req.url).origin
  const rows = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileName = `${crypto.randomUUID()}.${PHOTO_TYPES[file.type]}`
    const key = `properties/${propertyId}/${fileName}`
    await uploadToR2(c.env.R2, key, await file.arrayBuffer(), file.type)
    rows.push({
      property_id: propertyId,
      image_key: key,
      image_url: `${origin}/api/properties/images/${propertyId}/${fileName}`,
      position: startPosition + i,
    })
  }
  return getSupabase(c.env).from('property_images').insert(rows).select('id, image_url, position')
}

// The property if the signed-in user owns it (or is an admin), else an error response.
const ownedProperty = async (c: Ctx, propertyId: string) => {
  if (!UUID_RE.test(propertyId)) return { error: c.json({ success: false, message: 'Property not found' }, 404) }
  const user = c.get('user')
  const { data } = await getSupabase(c.env).from('properties').select('id, owner_id').eq('id', propertyId).single()
  if (!data) return { error: c.json({ success: false, message: 'Property not found' }, 404) }
  if (data.owner_id !== user.id && user.role !== 'admin') {
    return { error: c.json({ success: false, message: 'Not authorized' }, 403) }
  }
  return { property: data }
}

// GET /api/properties/images/:propertyId/:file — public PG photos.
// The R2 bucket is private (it also holds KYC documents), so photos are served
// through the Worker, and only from the properties/ prefix.
propertiesRouter.get('/images/:propertyId/:file', async (c) => {
  const { propertyId, file } = c.req.param()
  if (!UUID_RE.test(propertyId) || !PHOTO_FILE_RE.test(file)) return c.notFound()

  const object = await c.env.R2.get(`properties/${propertyId}/${file}`)
  if (!object) return c.notFound()

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'image/jpeg',
      // Keys are random UUIDs and never overwritten, so the file never changes.
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: object.httpEtag,
    },
  })
})

// GET /api/properties — public, with filters
propertiesRouter.get('/', publicCache, async (c) => {
  const supabase = getSupabase(c.env)
  const { city, state, minPrice, maxPrice, gender, roomType, search, sort, page = '1', limit = '12' } = c.req.query()

  // Room-type filtering uses a second, !inner-joined alias of property_rooms so
  // it filters in SQL (no giant `id IN (...)` list) while the plain
  // property_rooms embed still returns every room type for display.
  const columns: string = `
      id, name, address, city, state, landmark, lat, lng,
      amenities, gender, starting_price, rating, total_ratings,
      status, is_verified, available_beds, updated_at,
      property_images(image_url, position),
      property_rooms(type)${roomType ? ', room_filter:property_rooms!inner(type)' : ''}
    `
  let query = supabase
    .from('properties')
    .select(columns, { count: 'exact' })
    .eq('status', 'verified')
    .gt('listing_paid_until', nowIso())

  if (city) query = query.or(cityVariants(city).map((v) => `city.ilike.%${orSafe(v)}%`).join(','))
  if (state) query = query.ilike('state', `%${state}%`)
  if (gender) query = query.eq('gender', gender)
  if (minPrice && Number.isFinite(Number(minPrice))) query = query.gte('starting_price', Number(minPrice))
  if (maxPrice && Number.isFinite(Number(maxPrice))) query = query.lte('starting_price', Number(maxPrice))
  if (roomType) query = query.eq('room_filter.type', roomType)
  const term = search ? orSafe(search) : ''
  if (term) query = query.or(`name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%,address.ilike.%${term}%`)

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    price_asc: { column: 'starting_price', ascending: true },
    price_desc: { column: 'starting_price', ascending: false },
    rating: { column: 'rating', ascending: false },
    newest: { column: 'created_at', ascending: false },
  }
  const s = sortMap[sort ?? 'newest'] ?? { column: 'created_at', ascending: false }
  query = query.order(s.column, { ascending: s.ascending })
  // Lowest position first, so property_images[0] is always the owner's chosen cover.
  query = query.order('position', { referencedTable: 'property_images', ascending: true })

  const pageNum = Math.max(1, Math.floor(Number(page)) || 1)
  const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(limit)) || 12))
  const from = (pageNum - 1) * limitNum
  const to = from + limitNum - 1

  const { data: properties, count, error } = await query.range(from, to)
  if (error) return c.json({ success: false, message: error.message }, 500)

  return c.json({
    success: true,
    total: count ?? 0,
    page: pageNum,
    pages: Math.ceil((count ?? 0) / limitNum),
    properties: ((properties ?? []) as unknown as Record<string, unknown>[]).map(({ room_filter: _, ...p }) => p),
  })
})

// GET /api/properties/stats — real public numbers for the homepage.
// Two narrow columns, edge-cached for 30 minutes, so this stays cheap.
const statsCache = cache({ cacheName: 'pgcon-stats', cacheControl: 'public, max-age=1800' })
propertiesRouter.get('/stats', statsCache, async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('properties')
    .select('city, available_beds')
    .eq('status', 'verified')
    .gt('listing_paid_until', nowIso())
    .limit(50000)

  if (error) return c.json({ success: false, message: error.message }, 500)
  const rows = (data ?? []) as { city: string | null; available_beds: number | null }[]
  const cities = [...new Set(rows.map((r) => normalizeCity(r.city)).filter(Boolean))].sort()
  return c.json({
    success: true,
    stats: {
      listings: rows.length,
      cities,
      availableBeds: rows.reduce((sum, r) => sum + (r.available_beds ?? 0), 0),
    },
  })
})

// GET /api/properties/owner/mine — must come before /:id
propertiesRouter.get('/owner/mine', authMiddleware, requireRole('owner', 'admin'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *, property_images(id, image_key, image_url, position),
      property_rooms(*, beds(id, label, status, current_booking_id))
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .order('position', { referencedTable: 'property_images', ascending: true })

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, count: data?.length ?? 0, properties: data ?? [] })
})

// GET /api/properties/:id
// The view is recorded before the cache layer so cached hits still count, via
// an atomic SQL increment (a read-then-write here would lose concurrent views).
// ?preview=1 is the owner's "see it as students do" view: always fresh (no
// edge cache) and not counted as a view.
propertiesRouter.get('/:id', async (c, next) => {
  const id = c.req.param('id')
  if (!UUID_RE.test(id)) return c.json({ success: false, message: 'Property not found' }, 404)
  if (c.req.query('preview') !== '1') {
    c.executionCtx.waitUntil(
      Promise.resolve(getSupabase(c.env).rpc('increment_property_views', { prop_id: id })).then(({ error }) => {
        if (error) console.error('[properties/:id] increment_property_views failed:', error.message)
      })
    )
  }
  await next()
}, (c, next) => (c.req.query('preview') === '1' ? next() : publicCache(c, next)), async (c) => {
  const supabase = getSupabase(c.env)
  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      owner:profiles!properties_owner_id_fkey(id, first_name, last_name, phone, avatar),
      property_images(id, image_key, image_url, position),
      property_rooms(*)
    `)
    .eq('id', c.req.param('id'))
    .order('position', { referencedTable: 'property_images', ascending: true })
    .single()

  if (error || !property) return c.json({ success: false, message: 'Property not found' }, 404)

  return c.json({ success: true, property })
})

// POST /api/properties — owner creates listing
propertiesRouter.post('/', authMiddleware, requireRole('owner', 'admin'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)

  const contentType = c.req.header('content-type') ?? ''
  let body: Record<string, unknown>
  let imageFiles: File[] = []

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData()
    body = {
      name: formData.get('name'),
      tagline: formData.get('tagline'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      landmark: formData.get('landmark'),
      lat: formData.get('lat') ? Number(formData.get('lat')) : undefined,
      lng: formData.get('lng') ? Number(formData.get('lng')) : undefined,
      gender: formData.get('gender'),
      amenities: formData.get('amenities'),
      rooms: formData.get('rooms'),
      manager_name: formData.get('manager_name'),
      manager_phone: formData.get('manager_phone'),
      referral_code: formData.get('referral_code'),
      agent_code: formData.get('agent_code'),
      commission_option: formData.get('commission_option'),
    }
    imageFiles = (formData.getAll('images') as unknown[]).filter((f): f is File => f instanceof File)
  } else {
    body = await c.req.json()
  }

  if (!body.name || !body.address || !body.city || !body.state) {
    return c.json({ success: false, message: 'name, address, city, and state are required' }, 400)
  }
  const photoError = photoProblem(imageFiles)
  if (photoError) return c.json({ success: false, message: photoError }, 400)

  // Resolve referral code to referrer UUID
  let referredBy: string | null = null
  if (body.referral_code) {
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', body.referral_code)
      .eq('role', 'student')
      .single()
    referredBy = referrer?.id ?? null
  }

  // Resolve agent code to a verified agent UUID — unverified/invalid codes are silently ignored
  let agentId: string | null = null
  if (body.agent_code) {
    const { data: agent } = await supabase
      .from('profiles')
      .select('id')
      .eq('agent_code', body.agent_code)
      .eq('role', 'agent')
      .eq('is_verified_agent', true)
      .single()
    agentId = agent?.id ?? null
  }

  const amenities = typeof body.amenities === 'string'
    ? body.amenities.split(',').map((a: string) => a.trim()).filter(Boolean)
    : (body.amenities as string[] | undefined) ?? []

  let rooms: RoomInput[]
  try {
    rooms = typeof body.rooms === 'string' ? JSON.parse(body.rooms as string) : (body.rooms as RoomInput[]) ?? []
  } catch {
    return c.json({ success: false, message: 'Room details could not be read' }, 400)
  }
  // Check rooms before creating anything, so a bad room never leaves behind a
  // half-made property (which owners then re-submit, creating duplicates).
  const roomError = roomProblem(rooms)
  if (roomError) return c.json({ success: false, message: roomError }, 400)

  // Same owner + same PG name + same city already pending or live means this is
  // a re-submission (double click, back button, retry) — don't create a copy.
  const escapedName = String(body.name).trim().replace(/[\\%_]/g, (ch) => `\\${ch}`)
  const { data: existing } = await supabase
    .from('properties')
    .select('id, status')
    .eq('owner_id', user.id)
    .ilike('name', escapedName)
    .eq('city', normalizeCity(body.city as string))
    .in('status', ['pending', 'verified'])
    .limit(1)
    .maybeSingle()
  if (existing) {
    return c.json({
      success: false,
      code: 'duplicate_listing',
      property_id: existing.id,
      message: existing.status === 'pending'
        ? `You already submitted "${String(body.name).trim()}" — it's waiting for admin approval. You can track it in your Owner Dashboard.`
        : `"${String(body.name).trim()}" is already listed. Edit it from your Owner Dashboard instead of adding it again.`,
    }, 409)
  }

  // Calculate starting price from rooms
  const startingPrice = rooms.length > 0
    ? Math.min(...(rooms as Array<{ price: number }>).map((r) => r.price))
    : 0

  const { data: property, error } = await supabase
    .from('properties')
    .insert({
      owner_id: user.id,
      referred_by: referredBy,
      agent_id: agentId,
      name: body.name,
      tagline: body.tagline,
      address: body.address,
      city: normalizeCity(body.city),
      state: body.state,
      landmark: body.landmark,
      lat: body.lat,
      lng: body.lng,
      gender: body.gender ?? 'Co-ed',
      amenities,
      starting_price: startingPrice,
      manager_name: body.manager_name,
      manager_phone: body.manager_phone,
      commission_option: body.commission_option ?? 'recurring',
    })
    .select()
    .single()

  if (error || !property) return c.json({ success: false, message: error?.message ?? 'Failed to create property' }, 500)

  // Insert rooms, then provision one bed row per total_beds — the sync
  // trigger derives property_rooms/properties total_beds & available_beds
  // from these rows, so no manual counter math is needed here.
  if (rooms.length > 0) {
    const { data: insertedRooms, error: roomsError } = await supabase
      .from('property_rooms')
      .insert(rooms.map((r) => ({
        property_id: property.id,
        type: r.type,
        price: Number(r.price),
        total_beds: Number(r.total_beds),
        description: r.description ?? null,
      })))
      .select('id, type')

    if (roomsError) {
      // Roll back so the owner can simply retry without creating a duplicate.
      await supabase.from('properties').delete().eq('id', property.id)
      return c.json({ success: false, message: `Could not save rooms: ${roomsError.message}` }, 500)
    }

    // New beds: `available_beds` vacant (default: all), the rest occupied by
    // tenants the owner already has.
    const bedInserts = (insertedRooms ?? []).flatMap((room: { id: string; type: string }) => {
      const input = rooms.find((r) => r.type === room.type)!
      const total = Number(input.total_beds)
      const available = input.available_beds === undefined ? total : Number(input.available_beds)
      return Array.from({ length: total }, (_, i) => ({
        room_id: room.id,
        property_id: property.id,
        label: `Bed ${i + 1}`,
        status: i < available ? 'vacant' : 'occupied',
      }))
    })
    if (bedInserts.length > 0) await supabase.from('beds').insert(bedInserts)
  }

  if (imageFiles.length > 0) {
    const { error: imagesError } = await storePhotos(c, property.id, imageFiles, 0)
    if (imagesError) console.error('[properties/create] property_images insert failed:', imagesError.message)
  }

  return c.json({ success: true, message: 'Property submitted for review', property }, 201)
})

// POST /api/properties/:id/images — owner adds photos to an existing listing
propertiesRouter.post('/:id/images', authMiddleware, async (c) => {
  const propertyId = c.req.param('id')
  const owned = await ownedProperty(c, propertyId)
  if (owned.error) return owned.error

  const formData = await c.req.formData()
  const files = (formData.getAll('images') as unknown[]).filter((f): f is File => f instanceof File)
  if (files.length === 0) return c.json({ success: false, message: 'No photos received' }, 400)

  const supabase = getSupabase(c.env)
  const { data: existing } = await supabase.from('property_images').select('position').eq('property_id', propertyId)
  const problem = photoProblem(files, existing?.length ?? 0)
  if (problem) return c.json({ success: false, message: problem }, 400)

  const nextPosition = Math.max(-1, ...(existing ?? []).map((r: { position: number }) => r.position)) + 1
  const { data, error } = await storePhotos(c, propertyId, files, nextPosition)
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, images: data ?? [] }, 201)
})

// PATCH /api/properties/:id/images/order — body { image_ids: [...] }, first = cover
propertiesRouter.patch('/:id/images/order', authMiddleware, async (c) => {
  const propertyId = c.req.param('id')
  const owned = await ownedProperty(c, propertyId)
  if (owned.error) return owned.error

  const { image_ids } = await c.req.json()
  if (!Array.isArray(image_ids) || !image_ids.every((id) => typeof id === 'string' && UUID_RE.test(id))) {
    return c.json({ success: false, message: 'image_ids must be a list of photo ids' }, 400)
  }

  const supabase = getSupabase(c.env)
  // Scoped to this property, so ids from someone else's listing are ignored.
  await Promise.all(image_ids.map((id: string, position: number) =>
    supabase.from('property_images').update({ position }).eq('id', id).eq('property_id', propertyId)
  ))
  return c.json({ success: true })
})

// DELETE /api/properties/:id/images/:imageId — owner removes one photo
propertiesRouter.delete('/:id/images/:imageId', authMiddleware, async (c) => {
  const { id: propertyId, imageId } = c.req.param()
  const owned = await ownedProperty(c, propertyId)
  if (owned.error) return owned.error

  const supabase = getSupabase(c.env)
  const { data: image } = await supabase
    .from('property_images')
    .select('id, image_key')
    .eq('id', imageId)
    .eq('property_id', propertyId)
    .maybeSingle()
  if (!image) return c.json({ success: false, message: 'Photo not found' }, 404)

  await supabase.from('property_images').delete().eq('id', image.id)
  await deleteFromR2(c.env.R2, [image.image_key])
  return c.json({ success: true })
})

// PATCH /api/properties/:id — owner updates own listing
propertiesRouter.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const propertyId = c.req.param('id')

  const { data: existing } = await supabase.from('properties').select('*').eq('id', propertyId).single()
  if (!existing) return c.json({ success: false, message: 'Property not found' }, 404)
  if (existing.owner_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, message: 'Not authorized' }, 403)
  }

  const body = await c.req.json()
  const allowed = ['name', 'tagline', 'address', 'city', 'state', 'landmark', 'lat', 'lng', 'gender', 'amenities', 'manager_name', 'manager_phone']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  // Listing details can be edited but never blanked out.
  for (const key of ['name', 'address', 'city', 'state'] as const) {
    if (updates[key] === undefined) continue
    const value = typeof updates[key] === 'string' ? (updates[key] as string).trim() : ''
    if (!value) return c.json({ success: false, message: `${key[0].toUpperCase()}${key.slice(1)} can't be empty` }, 400)
    updates[key] = value
  }
  if (updates.gender !== undefined && !['Boys', 'Girls', 'Co-ed'].includes(updates.gender as string)) {
    return c.json({ success: false, message: 'Gender must be Boys, Girls or Co-ed' }, 400)
  }
  if (updates.amenities !== undefined && !Array.isArray(updates.amenities)) {
    return c.json({ success: false, message: 'Amenities must be a list' }, 400)
  }
  if (typeof updates.city === 'string') updates.city = normalizeCity(updates.city)

  // Rooms are checked up front — including against beds booked through PGCON —
  // so a bad room can't leave the listing half-saved.
  let incomingRooms: RoomInput[] | null = null
  type ExistingRoom = { id: string; type: string; beds: BedRow[] }
  let existingRooms: ExistingRoom[] = []
  if (body.rooms !== undefined) {
    try {
      incomingRooms = (Array.isArray(body.rooms) ? body.rooms : JSON.parse(body.rooms)) as RoomInput[]
    } catch {
      return c.json({ success: false, message: 'Room details could not be read' }, 400)
    }
    const roomError = roomProblem(incomingRooms)
    if (roomError) return c.json({ success: false, message: roomError }, 400)

    const { data: rows } = await supabase
      .from('property_rooms')
      .select('id, type, beds(id, label, status, current_booking_id)')
      .eq('property_id', propertyId)
    existingRooms = (rows ?? []) as ExistingRoom[]
    const keptIds = new Set(incomingRooms.map((r) => r.id).filter(Boolean))

    for (const room of existingRooms) {
      const held = room.beds.filter(isHeld).length
      const incoming = incomingRooms.find((r) => r.id === room.id)
      if (!incoming) {
        if (held > 0) {
          return c.json({ success: false, message: `The ${room.type} room has beds booked through PGCON, so it can't be removed.` }, 409)
        }
        continue
      }
      const total = Number(incoming.total_beds)
      if (total < held) {
        return c.json({ success: false, message: `The ${room.type} room has ${held} bed${held === 1 ? '' : 's'} booked through PGCON — it can't have fewer than ${held} beds.` }, 409)
      }
      if (incoming.available_beds !== undefined && Number(incoming.available_beds) > total - held) {
        return c.json({ success: false, message: `Only ${total - held} of the ${room.type} room's beds can be available — ${held} ${held === 1 ? 'is' : 'are'} booked through PGCON.` }, 409)
      }
    }
    if ([...keptIds].some((id) => !existingRooms.some((r) => r.id === id))) {
      return c.json({ success: false, message: 'One of these rooms no longer exists. Reload the page and try again.' }, 409)
    }
  }

  // Editing what students rely on to trust the listing (name, address…) sends a
  // live PG back for review. Rooms, prices and bed counts change all the time,
  // so updating only those keeps the PG live.
  const listingDetailsChanged = Object.keys(updates).some((k) => k !== 'updated_at')
  if (existing.status === 'verified' && listingDetailsChanged) {
    updates.status = 'pending'
    updates.is_verified = false
  }

  const { data, error } = await supabase.from('properties').update(updates).eq('id', propertyId).select().single()
  if (error) return c.json({ success: false, message: error.message }, 500)

  if (incomingRooms) {
    // Real bed rows are linked to bookings — a blind delete-all-and-reinsert
    // would CASCADE-delete beds out from under active tenancies. Diff instead.
    const keptIds = new Set(incomingRooms.map((r) => r.id).filter(Boolean))
    for (const room of existingRooms) {
      if (!keptIds.has(room.id)) await supabase.from('property_rooms').delete().eq('id', room.id)
    }

    for (const r of incomingRooms) {
      const total = Number(r.total_beds)
      const fields = { type: r.type, price: Number(r.price), description: r.description ?? null }
      let roomId = r.id
      // Older clients don't send availability: keep today's free beds, plus
      // any newly added ones.
      let available = r.available_beds === undefined ? undefined : Number(r.available_beds)

      if (roomId) {
        await supabase.from('property_rooms').update(fields).eq('id', roomId)
        if (available === undefined) {
          const beds = existingRooms.find((x) => x.id === roomId)!.beds
          const vacant = beds.filter((b) => b.status === 'vacant').length
          const held = beds.filter(isHeld).length
          available = Math.min(vacant + Math.max(total - beds.length, 0), total - held)
        }
      } else {
        const { data: newRoom, error: newRoomError } = await supabase
          .from('property_rooms')
          .insert({ ...fields, total_beds: total, property_id: propertyId })
          .select('id')
          .single()
        if (newRoomError || !newRoom) return c.json({ success: false, message: newRoomError?.message ?? 'Failed to add room' }, 500)
        roomId = newRoom.id as string
        if (available === undefined) available = total
      }

      await syncRoomBeds(supabase, roomId!, propertyId, total, available)
    }

    const startingPrice = Math.min(...incomingRooms.map((r) => Number(r.price)))
    await supabase.from('properties').update({ starting_price: startingPrice }).eq('id', propertyId)
    // total_beds/available_beds are no longer written here — the sync trigger
    // on `beds` derives both from the room/bed changes made above.
  }

  return c.json({ success: true, property: data, sent_for_review: updates.status === 'pending' })
})

// DELETE /api/properties/:id
propertiesRouter.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const propertyId = c.req.param('id')

  const { data: property } = await supabase.from('properties').select('owner_id').eq('id', propertyId).single()
  if (!property) return c.json({ success: false, message: 'Property not found' }, 404)
  if (property.owner_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, message: 'Not authorized' }, 403)
  }

  // Bookings cascade-delete with the PG, so a delete would silently erase
  // tenants' bookings. Make the owner settle them first.
  const { count: openBookings } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId)
    .in('status', ['pending', 'confirmed', 'active'])
  if ((openBookings ?? 0) > 0) {
    return c.json({
      success: false,
      code: 'has_open_bookings',
      message: `This PG has ${openBookings} open booking${openBookings === 1 ? '' : 's'}. Cancel or complete ${openBookings === 1 ? 'it' : 'them'} in the Bookings tab before deleting.`,
    }, 409)
  }

  // Rent payments and commissions are financial records and must be kept, so
  // a PG that has ever taken money can't be removed.
  const [{ count: payments }, { count: commissions }] = await Promise.all([
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
    supabase.from('commissions').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
  ])
  if ((payments ?? 0) > 0 || (commissions ?? 0) > 0) {
    return c.json({
      success: false,
      code: 'has_payment_history',
      message: "This PG has payment history, which we're required to keep, so it can't be deleted. Contact support and we'll take it off PGCON for you.",
    }, 409)
  }

  const { data: images } = await supabase.from('property_images').select('image_key').eq('property_id', propertyId)

  // Delete the row first: if that fails, the photos must still be there.
  const { error: deleteError } = await supabase.from('properties').delete().eq('id', propertyId)
  if (deleteError) {
    console.error('[properties/delete]', deleteError.message)
    return c.json({ success: false, message: "This PG couldn't be deleted. Contact support and we'll remove it for you." }, 500)
  }
  if (images?.length) await deleteFromR2(c.env.R2, images.map((img: { image_key: string }) => img.image_key))
  return c.json({ success: true, message: 'Property deleted' })
})
