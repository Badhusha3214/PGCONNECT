import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase'
import { authMiddleware, requireRole } from '../middleware/auth'
import { currentMonthKey, computeRentStatus } from '../lib/rent'
import { claimBedForRoom, releaseBed } from '../lib/beds'
import { isListingLive } from '../lib/listing'
import type { Env } from '../types'

export const bookingsRouter = new Hono<Env>()

// Attaches { rent_status, current_month } to each booking, computed from
// whether a 'paid' payment exists for the current calendar month.
const attachRentStatus = async (
  supabase: ReturnType<typeof getSupabase>,
  bookings: Array<{ id: string; status: string; move_in_date: string }>
) => {
  const month = currentMonthKey()
  if (!bookings.length) return bookings.map((b) => ({ ...b, rent_status: null, current_month: month }))

  const bookingIds = bookings.map((b) => b.id)
  const { data: paidThisMonth } = await supabase
    .from('payments')
    .select('booking_id')
    .in('booking_id', bookingIds)
    .eq('status', 'paid')
    .eq('month', month)

  const paidSet = new Set((paidThisMonth ?? []).map((p: { booking_id: string }) => p.booking_id))

  return bookings.map((b) => ({
    ...b,
    rent_status: computeRentStatus(b.status, b.move_in_date, paidSet.has(b.id)),
    current_month: month,
  }))
}

// POST /api/bookings
bookingsRouter.post('/', authMiddleware, requireRole('student', 'admin'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const { property_id, room_type, move_in_date, monthly_rent, notes } = await c.req.json()

  if (!property_id || !room_type || !move_in_date || !monthly_rent) {
    return c.json({ success: false, message: 'property_id, room_type, move_in_date, monthly_rent are required' }, 400)
  }

  const { data: property } = await supabase.from('properties').select('status, listing_paid_until').eq('id', property_id).single()
  if (!property || !isListingLive(property)) {
    return c.json({ success: false, message: 'Property is not available for booking' }, 400)
  }

  // Soft check only — no bed is claimed until the owner confirms. Just stops
  // tenants from requesting into a room type that's already visibly full.
  const { data: roomBucket } = await supabase
    .from('property_rooms')
    .select('available_beds')
    .eq('property_id', property_id)
    .eq('type', room_type)
    .single()
  if (!roomBucket || roomBucket.available_beds <= 0) {
    return c.json({ success: false, message: 'No beds are currently available for this room type' }, 400)
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({ tenant_id: user.id, property_id, room_type, move_in_date, monthly_rent, notes })
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, booking: data }, 201)
})

// GET /api/bookings/mine — tenant's bookings
bookingsRouter.get('/mine', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *, properties(id, name, address, city, starting_price,
        property_images(image_url, position))
    `)
    .eq('tenant_id', user.id)
    .order('created_at', { ascending: false })
    .order('position', { referencedTable: 'properties.property_images', ascending: true })

  if (error) return c.json({ success: false, message: error.message }, 500)
  const bookings = await attachRentStatus(supabase, data ?? [])
  return c.json({ success: true, count: bookings.length, bookings })
})

// GET /api/bookings/owner — owner sees bookings for their properties
bookingsRouter.get('/owner', authMiddleware, requireRole('owner', 'admin'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)

  const { data: myProps } = await supabase.from('properties').select('id').eq('owner_id', user.id)
  const propIds = myProps?.map((p: { id: string }) => p.id) ?? []
  if (!propIds.length) return c.json({ success: true, count: 0, bookings: [] })

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      tenant:profiles!bookings_tenant_id_fkey(id, first_name, last_name, phone),
      properties(id, name, city)
    `)
    .in('property_id', propIds)
    .order('created_at', { ascending: false })

  if (error) return c.json({ success: false, message: error.message }, 500)
  const bookings = await attachRentStatus(supabase, data ?? [])
  return c.json({ success: true, count: bookings.length, bookings })
})

// PATCH /api/bookings/:id — update booking status (owner/admin)
bookingsRouter.patch('/:id', authMiddleware, async (c) => {
  const supabase = getSupabase(c.env)
  const user = c.get('user')
  const { status, payment_status } = await c.req.json()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, properties(owner_id)')
    .eq('id', c.req.param('id'))
    .single()

  if (!booking) return c.json({ success: false, message: 'Booking not found' }, 404)

  const isOwner = (booking.properties as { owner_id: string })?.owner_id === user.id
  const isTenant = booking.tenant_id === user.id
  if (!isOwner && !isTenant && user.role !== 'admin') {
    return c.json({ success: false, message: 'Not authorized' }, 403)
  }

  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (payment_status) updates.payment_status = payment_status

  // Owner confirming a request is the moment a specific bed gets claimed —
  // the atomic checkpoint that actually prevents double-booking a room type.
  if (status === 'confirmed' && booking.status !== 'confirmed') {
    const { data: room } = await supabase
      .from('property_rooms')
      .select('id')
      .eq('property_id', booking.property_id)
      .eq('type', booking.room_type)
      .single()

    const claimed = room ? await claimBedForRoom(supabase, room.id, booking.tenant_id, booking.id) : null
    if (!claimed) {
      return c.json({ success: false, message: 'No beds available for this room type right now' }, 409)
    }
    updates.bed_id = claimed.id
  }

  // Cancelling a request/hold frees the bed immediately instead of waiting
  // out the lock's TTL.
  if (status === 'cancelled' && ['pending', 'confirmed'].includes(booking.status) && booking.bed_id) {
    await releaseBed(supabase, booking.bed_id, booking.id)
  }

  const { data, error } = await supabase.from('bookings').update(updates).eq('id', booking.id).select().single()
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, booking: data })
})
