// Seeds the Supabase project with realistic dev/test data: owners, students,
// agents, properties with real per-bed inventory, bookings in every status
// (pending / confirmed / active-paid / active-overdue / cancelled), payments,
// referrer + agent commissions, reviews, and inquiries.
//
// Uses the Supabase Admin API to create real auth users (same mechanism the
// app's own /api/auth/register uses), then service-role table inserts for
// everything else. Safe to re-run — every row uses a fixed id and is upserted.
//
// Usage: npm run seed   (reads backend/.dev.vars for Supabase credentials)

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const loadDevVars = () => {
  try {
    const raw = readFileSync(join(__dirname, '..', '.dev.vars'), 'utf8')
    const vars = {}
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
    }
    return vars
  } catch {
    return {}
  }
}

const devVars = loadDevVars()
const SUPABASE_URL = process.env.SUPABASE_URL || devVars.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || devVars.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Fill in backend/.dev.vars first.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SEED_PASSWORD = 'Password123!'

const id = (n) => `a0000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const propId = (n) => `b0000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const roomId = (n) => `c0000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const bedId = (n) => `d0000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const bookingId = (n) => `e0000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const paymentId = (n) => `f0000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const commissionId = (n) => `10000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const reviewId = (n) => `20000000-0000-0000-0000-${String(n).padStart(12, '0')}`

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
const today = new Date()
const currentMonth = monthKey(today)
const lastMonth = monthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1))

const genCode = () => Math.random().toString(36).slice(2, 10).toUpperCase()

async function getOrCreateAuthUser(userId, email) {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
  })
  if (!error) return created.user.id

  if (!/already.*registered|already exists/i.test(error.message)) throw error

  // Already exists from a previous run (or leftover from an earlier project
  // state) — reset password + confirmation so SEED_PASSWORD always actually
  // works, instead of silently keeping whatever credential the account had.
  let page = 1
  while (true) {
    const { data, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (listError) throw listError
    const match = data.users.find((u) => u.email === email)
    if (match) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(match.id, {
        password: SEED_PASSWORD,
        email_confirm: true,
      })
      if (updateError) throw updateError
      return match.id
    }
    if (data.users.length < 200) break
    page += 1
  }
  throw new Error(`Could not find or create auth user for ${email}`)
}

async function upsertProfile(userId, profile) {
  const { error } = await supabase.from('profiles').upsert({ id: userId, ...profile }, { onConflict: 'id' })
  if (error) throw new Error(`profile ${profile.first_name}: ${error.message}`)
}

console.log('Creating auth users + profiles...')

const users = {
  admin: { n: 1, email: 'admin@pgconnect.test', role: 'admin', first_name: 'Admin', last_name: 'User' },
  rajesh: { n: 2, email: 'owner.rajesh@pgconnect.test', role: 'owner', first_name: 'Rajesh', last_name: 'Kumar', is_verified_owner: true, phone: '9876500001' },
  priya: { n: 3, email: 'owner.priya@pgconnect.test', role: 'owner', first_name: 'Priya', last_name: 'Nair', is_verified_owner: true, phone: '9876500002' },
  ananya: { n: 4, email: 'student.ananya@pgconnect.test', role: 'student', first_name: 'Ananya', last_name: 'Pillai', university: 'College of Engineering Trivandrum', phone: '9876500003' },
  arjun: { n: 5, email: 'student.arjun@pgconnect.test', role: 'student', first_name: 'Arjun', last_name: 'Menon', university: 'Cochin University of Science and Technology', phone: '9876500004' },
  divya: { n: 6, email: 'student.divya@pgconnect.test', role: 'student', first_name: 'Divya', last_name: 'Warrier', university: 'NIT Calicut', phone: '9876500005' },
  karthik: { n: 7, email: 'student.karthik@pgconnect.test', role: 'student', first_name: 'Karthik', last_name: 'Iyer', university: 'IIM Kozhikode', phone: '9876500006' },
  vishnu: { n: 8, email: 'agent.vishnu@pgconnect.test', role: 'agent', first_name: 'Vishnu', last_name: 'Prasad', is_verified_agent: true, phone: '9876500007' },
  pendingAgent: { n: 9, email: 'agent.pending@pgconnect.test', role: 'agent', first_name: 'Sandra', last_name: 'Thomas', is_verified_agent: false, phone: '9876500008' },
}

const uid = {}
for (const [key, u] of Object.entries(users)) {
  uid[key] = await getOrCreateAuthUser(id(u.n), u.email)
  const profile = { role: u.role, first_name: u.first_name, last_name: u.last_name, phone: u.phone ?? null, is_active: true }
  if (u.university) profile.university = u.university
  if (u.role === 'owner') profile.is_verified_owner = u.is_verified_owner
  if (u.role === 'agent') { profile.is_verified_agent = u.is_verified_agent; profile.agent_code = genCode() }
  if (u.role === 'student') profile.referral_code = genCode()
  await upsertProfile(uid[key], profile)
}

console.log('Creating properties, rooms, and beds...')

const properties = [
  {
    id: propId(1), owner: 'rajesh', name: 'Sunrise Men\'s PG', tagline: 'Walk to campus in 5 minutes',
    address: 'TC 24/1123, Sasthamangalam', city: 'Thiruvananthapuram', state: 'Kerala', landmark: 'Near Government College',
    lat: 8.5090, lng: 76.9548,
    gender: 'Boys', status: 'verified', referred_by: uid.divya, amenities: ['wifi', 'meals', 'laundry', 'security'],
    manager_name: 'Rajesh Kumar', manager_phone: '9876500001',
    rooms: [
      { id: roomId(1), type: 'Single', price: 8000, total_beds: 3, description: 'Private single room, attached bath' },
      { id: roomId(2), type: 'Double', price: 6000, total_beds: 4, description: 'Twin sharing, common bath' },
    ],
  },
  {
    id: propId(2), owner: 'priya', name: 'Green Valley Co-living', tagline: 'Modern co-living for working professionals',
    address: 'Door No 42, Kakkanad', city: 'Kochi', state: 'Kerala', landmark: 'Near InfoPark',
    lat: 10.0093, lng: 76.3492,
    gender: 'Co-ed', status: 'verified', agent_id: uid.vishnu, agent_bounty_paid: true,
    amenities: ['wifi', 'ac', 'gym', 'meals', 'security'], manager_name: 'Priya Nair', manager_phone: '9876500002',
    rooms: [
      { id: roomId(3), type: 'Double', price: 7000, total_beds: 2, description: 'AC twin sharing' },
      { id: roomId(4), type: 'Triple', price: 5000, total_beds: 6, description: 'Non-AC triple sharing' },
    ],
  },
  {
    id: propId(3), owner: 'rajesh', name: 'Budget Boys Hostel', tagline: 'Simple, clean, affordable',
    address: 'MG Road', city: 'Thiruvananthapuram', state: 'Kerala', landmark: 'Near Railway Station',
    lat: 8.4870, lng: 76.9525,
    gender: 'Boys', status: 'pending', amenities: ['wifi', 'meals'], manager_name: 'Rajesh Kumar', manager_phone: '9876500001',
    rooms: [
      { id: roomId(5), type: 'Single', price: 5500, total_beds: 2, description: 'Budget single occupancy' },
    ],
  },
  {
    id: propId(4), owner: 'priya', name: 'Riverside Ladies PG', tagline: 'Safe, homely stay for working women',
    address: 'Marine Drive Road', city: 'Kochi', state: 'Kerala', landmark: 'Near Marine Drive',
    lat: 9.9744, lng: 76.2814,
    gender: 'Girls', status: 'verified', amenities: ['wifi', 'meals', 'security', 'laundry'],
    manager_name: 'Priya Nair', manager_phone: '9876500002',
    rooms: [
      { id: roomId(6), type: 'Double', price: 6500, total_beds: 4, description: 'Twin sharing, balcony view' },
      { id: roomId(7), type: 'Triple', price: 5000, total_beds: 6, description: 'Triple sharing, common bath' },
    ],
  },
  {
    id: propId(5), owner: 'rajesh', name: 'Tech Park Residency', tagline: 'Steps away from Technopark Phase 1',
    address: 'Kazhakkoottam', city: 'Thiruvananthapuram', state: 'Kerala', landmark: 'Near Technopark',
    lat: 8.5565, lng: 76.8801,
    gender: 'Co-ed', status: 'verified', amenities: ['wifi', 'ac', 'meals', 'gym', 'security'],
    manager_name: 'Rajesh Kumar', manager_phone: '9876500001',
    rooms: [
      { id: roomId(8), type: 'Single', price: 9500, total_beds: 2, description: 'AC single, work desk included' },
      { id: roomId(9), type: 'Double', price: 7000, total_beds: 3, description: 'AC twin sharing' },
    ],
  },
  {
    id: propId(6), owner: 'priya', name: 'Calicut Comfort Stay', tagline: 'Budget-friendly and centrally located',
    address: 'Mavoor Road', city: 'Kozhikode', state: 'Kerala', landmark: 'Near KSRTC Bus Stand',
    lat: 11.2588, lng: 75.7804,
    gender: 'Boys', status: 'verified', amenities: ['wifi', 'meals'],
    manager_name: 'Priya Nair', manager_phone: '9876500002',
    rooms: [
      { id: roomId(10), type: 'Double', price: 5500, total_beds: 5, description: 'Twin sharing, fan rooms' },
    ],
  },
  {
    id: propId(7), owner: 'rajesh', name: 'Palm Grove PG', tagline: 'Quiet residential neighbourhood, women-only',
    address: 'Vyttila', city: 'Kochi', state: 'Kerala', landmark: 'Near Vyttila Hub',
    lat: 9.9686, lng: 76.3220,
    gender: 'Girls', status: 'verified', amenities: ['wifi', 'meals', 'laundry', 'security', 'ac'],
    manager_name: 'Rajesh Kumar', manager_phone: '9876500001',
    rooms: [
      { id: roomId(11), type: 'Single', price: 8500, total_beds: 2, description: 'AC single occupancy' },
      { id: roomId(12), type: 'Triple', price: 4800, total_beds: 6, description: 'Non-AC triple sharing' },
    ],
  },
  {
    id: propId(8), owner: 'priya', name: 'Metro Living Hostel', tagline: 'Modern hostel near Thrissur town',
    address: 'Round North', city: 'Thrissur', state: 'Kerala', landmark: 'Near Thrissur Round',
    lat: 10.5276, lng: 76.2144,
    gender: 'Co-ed', status: 'verified', amenities: ['wifi', 'meals', 'security'],
    manager_name: 'Priya Nair', manager_phone: '9876500002',
    rooms: [
      { id: roomId(13), type: 'Double', price: 6000, total_beds: 4, description: 'Twin sharing' },
    ],
  },
  {
    id: propId(9), owner: 'rajesh', name: 'Scholars Den', tagline: 'Popular with MBA and engineering students',
    address: 'Nagampadam', city: 'Kottayam', state: 'Kerala', landmark: 'Near Kottayam Railway Station',
    lat: 9.5916, lng: 76.5222,
    gender: 'Boys', status: 'verified', amenities: ['wifi', 'meals', 'laundry'],
    manager_name: 'Rajesh Kumar', manager_phone: '9876500001',
    rooms: [
      { id: roomId(14), type: 'Single', price: 6000, total_beds: 3, description: 'Single occupancy, study table' },
      { id: roomId(15), type: 'Double', price: 4500, total_beds: 4, description: 'Twin sharing' },
    ],
  },
  {
    id: propId(10), owner: 'priya', name: 'Elite Women\'s Residency', tagline: 'Premium stay with hotel-like amenities',
    address: 'Kowdiar', city: 'Thiruvananthapuram', state: 'Kerala', landmark: 'Near Kowdiar Palace',
    lat: 8.5241, lng: 76.9581,
    gender: 'Girls', status: 'verified', amenities: ['wifi', 'ac', 'meals', 'gym', 'security', 'laundry'],
    manager_name: 'Priya Nair', manager_phone: '9876500002',
    rooms: [
      { id: roomId(16), type: 'Single', price: 11000, total_beds: 2, description: 'Premium AC single with attached bath' },
      { id: roomId(17), type: 'Double', price: 8000, total_beds: 3, description: 'AC twin sharing' },
    ],
  },
  // ── Added dummy listings (append-only: bed numbering depends on order) ──
  {
    id: propId(11), owner: 'priya', name: 'Lakeview Ladies Hostel', tagline: 'Peaceful lakeside stay for students',
    address: 'Punnamada', city: 'Alappuzha', state: 'Kerala', landmark: 'Near Punnamada Lake',
    lat: 9.5076, lng: 76.3471,
    gender: 'Girls', status: 'verified', amenities: ['wifi', 'meals', 'security', 'laundry'],
    manager_name: 'Priya Nair', manager_phone: '9876500002',
    rooms: [
      { id: roomId(18), type: 'Double', price: 5500, total_beds: 4, description: 'Twin sharing with lake-facing windows' },
      { id: roomId(19), type: 'Triple', price: 4200, total_beds: 6, description: 'Spacious triple sharing' },
    ],
  },
  {
    id: propId(12), owner: 'rajesh', name: 'Campus Corner PG', tagline: '2 minutes from Cochin University gate',
    address: 'South Kalamassery', city: 'Kochi', state: 'Kerala', landmark: 'Near CUSAT Main Gate',
    lat: 10.0436, lng: 76.3245,
    gender: 'Boys', status: 'verified', amenities: ['wifi', 'meals', 'laundry'],
    manager_name: 'Rajesh Kumar', manager_phone: '9876500001',
    rooms: [
      { id: roomId(20), type: 'Single', price: 7000, total_beds: 3, description: 'Single room with study desk' },
      { id: roomId(21), type: 'Triple', price: 4000, total_beds: 9, description: 'Budget triple sharing' },
    ],
  },
  {
    id: propId(13), owner: 'priya', name: 'The Nest Co-living', tagline: 'Designer rooms, community events every weekend',
    address: 'Panampilly Nagar', city: 'Kochi', state: 'Kerala', landmark: 'Near Panampilly Avenue',
    lat: 9.9585, lng: 76.2950,
    gender: 'Co-ed', status: 'verified', amenities: ['wifi', 'ac', 'gym', 'meals', 'security', 'laundry'],
    manager_name: 'Priya Nair', manager_phone: '9876500002',
    rooms: [
      { id: roomId(22), type: 'Single', price: 12500, total_beds: 4, description: 'Premium AC single, attached bath' },
      { id: roomId(23), type: 'Double', price: 9000, total_beds: 6, description: 'AC twin sharing with balcony' },
    ],
  },
  {
    id: propId(14), owner: 'rajesh', name: 'Medico Stay', tagline: 'Quiet stay for medical students',
    address: 'Medical College Road', city: 'Thiruvananthapuram', state: 'Kerala', landmark: 'Near Govt Medical College',
    lat: 8.5235, lng: 76.9278,
    gender: 'Girls', status: 'verified', amenities: ['wifi', 'meals', 'security'],
    manager_name: 'Rajesh Kumar', manager_phone: '9876500001',
    rooms: [
      { id: roomId(24), type: 'Double', price: 6500, total_beds: 6, description: 'Twin sharing, study hall access' },
    ],
  },
  {
    id: propId(15), owner: 'priya', name: 'Beach Road Residency', tagline: 'Sea breeze and city convenience',
    address: 'Beach Road', city: 'Kozhikode', state: 'Kerala', landmark: 'Near Kozhikode Beach',
    lat: 11.2560, lng: 75.7700,
    gender: 'Co-ed', status: 'verified', amenities: ['wifi', 'ac', 'meals', 'security'],
    manager_name: 'Priya Nair', manager_phone: '9876500002',
    rooms: [
      { id: roomId(25), type: 'Single', price: 8000, total_beds: 3, description: 'AC single, sea-facing' },
      { id: roomId(26), type: 'Double', price: 6000, total_beds: 4, description: 'Twin sharing' },
    ],
  },
  {
    id: propId(16), owner: 'rajesh', name: 'NIT Gate Hostel', tagline: 'Built for NIT Calicut students',
    address: 'Chathamangalam', city: 'Kozhikode', state: 'Kerala', landmark: 'Opposite NIT Calicut',
    lat: 11.3216, lng: 75.9336,
    gender: 'Boys', status: 'verified', amenities: ['wifi', 'meals', 'laundry', 'gym'],
    manager_name: 'Rajesh Kumar', manager_phone: '9876500001',
    rooms: [
      { id: roomId(27), type: 'Double', price: 5000, total_beds: 8, description: 'Twin sharing, 24x7 wifi' },
      { id: roomId(28), type: 'Triple', price: 3800, total_beds: 9, description: 'Triple sharing' },
    ],
  },
  {
    id: propId(17), owner: 'priya', name: 'Cultural Capital PG', tagline: 'Walk to Swaraj Round and colleges',
    address: 'Chembukkavu', city: 'Thrissur', state: 'Kerala', landmark: 'Near St. Thomas College',
    lat: 10.5310, lng: 76.2230,
    gender: 'Girls', status: 'verified', amenities: ['wifi', 'meals', 'security', 'laundry'],
    manager_name: 'Priya Nair', manager_phone: '9876500002',
    rooms: [
      { id: roomId(29), type: 'Single', price: 6800, total_beds: 2, description: 'Single room' },
      { id: roomId(30), type: 'Double', price: 5200, total_beds: 6, description: 'Twin sharing' },
    ],
  },
  {
    id: propId(18), owner: 'rajesh', name: 'Hilltop Retreat PG', tagline: 'Cool climate, calm surroundings',
    address: 'Kalpetta Town', city: 'Wayanad', state: 'Kerala', landmark: 'Near Kalpetta Bus Stand',
    lat: 11.6085, lng: 76.0830,
    gender: 'Co-ed', status: 'verified', amenities: ['wifi', 'meals'],
    manager_name: 'Rajesh Kumar', manager_phone: '9876500001',
    rooms: [
      { id: roomId(31), type: 'Double', price: 4500, total_beds: 4, description: 'Twin sharing, hill view' },
    ],
  },
  {
    id: propId(19), owner: 'priya', name: 'Infopark Smart Stay', tagline: 'Shuttle to Infopark every 30 minutes',
    address: 'Infopark Expressway', city: 'Kochi', state: 'Kerala', landmark: 'Near Infopark Phase 2',
    lat: 10.0130, lng: 76.3620,
    gender: 'Boys', status: 'verified', amenities: ['wifi', 'ac', 'meals', 'gym', 'security'],
    manager_name: 'Priya Nair', manager_phone: '9876500002',
    rooms: [
      { id: roomId(32), type: 'Single', price: 10000, total_beds: 4, description: 'AC single with work desk' },
      { id: roomId(33), type: 'Double', price: 7500, total_beds: 6, description: 'AC twin sharing' },
    ],
  },
  {
    id: propId(20), owner: 'rajesh', name: 'Kollam Coastal PG', tagline: 'Affordable stay near TKM College',
    address: 'Karicode', city: 'Kollam', state: 'Kerala', landmark: 'Near TKM College of Engineering',
    lat: 8.9142, lng: 76.6327,
    gender: 'Boys', status: 'pending', amenities: ['wifi', 'meals'],
    manager_name: 'Rajesh Kumar', manager_phone: '9876500001',
    rooms: [
      { id: roomId(34), type: 'Triple', price: 3500, total_beds: 6, description: 'Budget triple sharing' },
    ],
  },
]

for (const p of properties) {
  const startingPrice = Math.min(...p.rooms.map((r) => r.price))
  const { error: propError } = await supabase.from('properties').upsert({
    id: p.id, owner_id: uid[p.owner], referred_by: p.referred_by ?? null, agent_id: p.agent_id ?? null,
    agent_bounty_paid: p.agent_bounty_paid ?? false,
    name: p.name, tagline: p.tagline, address: p.address, city: p.city, state: p.state, landmark: p.landmark,
    lat: p.lat ?? null, lng: p.lng ?? null,
    gender: p.gender, amenities: p.amenities, starting_price: startingPrice,
    status: p.status, is_verified: p.status === 'verified', verified_at: p.status === 'verified' ? new Date().toISOString() : null,
    manager_name: p.manager_name, manager_phone: p.manager_phone, views: Math.floor(Math.random() * 200) + 20,
    // Verified seed listings take a free launch slot, live for a year (migration 005).
    free_listing_slot: p.status === 'verified',
    listing_paid_until: p.status === 'verified' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
  }, { onConflict: 'id' })
  if (propError) throw new Error(`property ${p.name}: ${propError.message}`)

  for (const r of p.rooms) {
    const { error: roomError } = await supabase.from('property_rooms').upsert({
      id: r.id, property_id: p.id, type: r.type, price: r.price, total_beds: r.total_beds, description: r.description,
    }, { onConflict: 'id' })
    if (roomError) throw new Error(`room ${r.type} @ ${p.name}: ${roomError.message}`)
  }
}

console.log('Adding property photos...')

const imageId = (n) => `30000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const PHOTOS = [
  'photo-1522202176988-66273c2fd55f',
  'photo-1545324418-cc1a3fa10c00',
  'photo-1554995207-c18c203602cb',
  'photo-1555041469-a586c61ea9bc',
  'photo-1562774053-701939374585',
  'photo-1618221195710-dd6b41faaea6',
]
let imageCounter = 1
const imageRows = []
properties.forEach((p, pi) => {
  for (let pos = 0; pos < 3; pos++) {
    const photo = PHOTOS[(pi + pos) % PHOTOS.length]
    imageRows.push({
      id: imageId(imageCounter++), property_id: p.id, position: pos,
      image_key: `seed/${photo}`, image_url: `https://images.unsplash.com/${photo}?w=900&q=80`,
    })
  }
})
const { error: imagesError } = await supabase.from('property_images').upsert(imageRows, { onConflict: 'id' })
if (imagesError) throw new Error(`images: ${imagesError.message}`)

console.log('Provisioning beds (all vacant to start)...')

// Numbered in property/room declaration order, so bedId(1) is always property[0]'s
// room[0]'s first bed, etc. — the specific beds referenced by the seeded
// bookings below (bedId(1), bedId(4), bedId(8), bedId(10)) rely on this order
// staying stable, so append new properties/rooms rather than reordering existing ones.
let bedCounter = 1
const bedLayout = []
for (const p of properties) {
  for (const r of p.rooms) {
    for (let i = 1; i <= r.total_beds; i++) {
      bedLayout.push({ n: bedCounter++, room: r.id, prop: p.id, label: `Bed ${i}` })
    }
  }
}

const { error: bedsError } = await supabase.from('beds').upsert(
  bedLayout.map((b) => ({ id: bedId(b.n), room_id: b.room, property_id: b.prop, label: b.label, status: 'vacant' })),
  { onConflict: 'id' }
)
if (bedsError) throw new Error(`beds: ${bedsError.message}`)

console.log('Creating bookings (pending / confirmed / active-paid / active-overdue / cancelled)...')

const hold48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

const bookings = [
  // 1. Pending request — no bed claimed yet (matches the confirm-time claim design)
  { id: bookingId(1), tenant: 'ananya', property: propId(1), room_type: 'Single', move_in_date: '2026-08-20', monthly_rent: 8000, status: 'pending', payment_status: 'unpaid', bed: null },
  // 2. Owner confirmed — bed locked, awaiting first payment
  { id: bookingId(2), tenant: 'arjun', property: propId(1), room_type: 'Double', move_in_date: '2026-08-10', monthly_rent: 6000, status: 'confirmed', payment_status: 'unpaid', bed: bedId(4) },
  // 3. Active, paid this month
  { id: bookingId(3), tenant: 'divya', property: propId(2), room_type: 'Double', move_in_date: '2026-02-10', monthly_rent: 7000, status: 'active', payment_status: 'paid', bed: bedId(8) },
  // 4. Active, NOT paid this month, move-in day already passed -> overdue
  { id: bookingId(4), tenant: 'ananya', property: propId(2), room_type: 'Triple', move_in_date: '2026-01-01', monthly_rent: 5000, status: 'active', payment_status: 'paid', bed: bedId(10) },
  // 5. Cancelled before ever being confirmed
  { id: bookingId(5), tenant: 'arjun', property: propId(1), room_type: 'Single', move_in_date: '2026-07-01', monthly_rent: 8000, status: 'cancelled', payment_status: 'unpaid', bed: null, notes: 'Change of plans' },
  // 6. Active, paid this month (also generates referrer commission for divya)
  { id: bookingId(6), tenant: 'karthik', property: propId(1), room_type: 'Single', move_in_date: '2026-03-15', monthly_rent: 8000, status: 'active', payment_status: 'paid', bed: bedId(1) },
]

for (const b of bookings) {
  const { error } = await supabase.from('bookings').upsert({
    id: b.id, tenant_id: uid[b.tenant], property_id: b.property, room_type: b.room_type,
    move_in_date: b.move_in_date, monthly_rent: b.monthly_rent, status: b.status,
    payment_status: b.payment_status, bed_id: b.bed, notes: b.notes ?? null,
  }, { onConflict: 'id' })
  if (error) throw new Error(`booking ${b.id}: ${error.message}`)
}

console.log('Locking/occupying the beds tied to those bookings...')

const bedStateUpdates = [
  { bed: bedId(4), status: 'locked', locked_by: uid.arjun, locked_at: new Date().toISOString(), locked_until: hold48h, current_booking_id: bookingId(2) },
  { bed: bedId(8), status: 'occupied', current_booking_id: bookingId(3) },
  { bed: bedId(10), status: 'occupied', current_booking_id: bookingId(4) },
  { bed: bedId(1), status: 'occupied', current_booking_id: bookingId(6) },
]

for (const u of bedStateUpdates) {
  const { error } = await supabase.from('beds').update({
    status: u.status, locked_by: u.locked_by ?? null, locked_at: u.locked_at ?? null,
    locked_until: u.locked_until ?? null, current_booking_id: u.current_booking_id,
  }).eq('id', u.bed)
  if (error) throw new Error(`bed update ${u.bed}: ${error.message}`)
}

console.log('Creating payments + commissions...')

// Payment 1: booking 3 (property B, agent-connected), paid this month
const pay1 = {
  id: paymentId(1), booking_id: bookingId(3), tenant_id: uid.divya, property_id: propId(2), amount: 7000,
  platform_fee: 350, referrer_commission: 0, agent_commission: 70, platform_revenue: 280, owner_payout: 6650,
  razorpay_order_id: 'seed_order_1', razorpay_payment_id: 'seed_pay_1', status: 'paid', month: currentMonth,
}
// Payment 2: booking 4 (property B), paid LAST month only (this month unpaid -> overdue)
const pay2 = {
  id: paymentId(2), booking_id: bookingId(4), tenant_id: uid.ananya, property_id: propId(2), amount: 5000,
  platform_fee: 250, referrer_commission: 0, agent_commission: 50, platform_revenue: 200, owner_payout: 4750,
  razorpay_order_id: 'seed_order_2', razorpay_payment_id: 'seed_pay_2', status: 'paid', month: lastMonth,
}
// Payment 3: booking 6 (property A, referred by divya), paid this month
const pay3 = {
  id: paymentId(3), booking_id: bookingId(6), tenant_id: uid.karthik, property_id: propId(1), amount: 8000,
  platform_fee: 400, referrer_commission: 160, agent_commission: 0, platform_revenue: 240, owner_payout: 7600,
  razorpay_order_id: 'seed_order_3', razorpay_payment_id: 'seed_pay_3', status: 'paid', month: currentMonth,
}

for (const pay of [pay1, pay2, pay3]) {
  const { error } = await supabase.from('payments').upsert(pay, { onConflict: 'id' })
  if (error) throw new Error(`payment ${pay.id}: ${error.message}`)
}

const commissions = [
  { id: commissionId(1), referrer_id: uid.divya, property_id: propId(1), payment_id: paymentId(3), amount: 160, type: 'recurring', role: 'referrer', status: 'pending', month: currentMonth },
  { id: commissionId(2), referrer_id: uid.vishnu, property_id: propId(2), payment_id: null, amount: 500, type: 'bounty', role: 'agent', status: 'paid', month: lastMonth },
  { id: commissionId(3), referrer_id: uid.vishnu, property_id: propId(2), payment_id: paymentId(1), amount: 70, type: 'recurring', role: 'agent', status: 'pending', month: currentMonth },
  { id: commissionId(4), referrer_id: uid.vishnu, property_id: propId(2), payment_id: paymentId(2), amount: 50, type: 'recurring', role: 'agent', status: 'pending', month: lastMonth },
]
for (const c of commissions) {
  const { error } = await supabase.from('commissions').upsert(c, { onConflict: 'id' })
  if (error) throw new Error(`commission ${c.id}: ${error.message}`)
}

// Reflect the commissions above in each earner's running balance.
await supabase.from('profiles').update({ commission_balance: 160, total_commission_earned: 160 }).eq('id', uid.divya)
await supabase.from('profiles').update({ commission_balance: 120, total_commission_earned: 620 }).eq('id', uid.vishnu)

console.log('Creating reviews...')

const reviews = [
  { id: reviewId(1), property_id: propId(1), tenant_id: uid.karthik, rating: 5, comment: 'Great location, food is homely and the owner is very responsive.', is_verified_stay: true, status: 'approved' },
  { id: reviewId(2), property_id: propId(2), tenant_id: uid.divya, rating: 4, comment: 'Clean rooms and good wifi, a bit noisy on weekends.', is_verified_stay: true, status: 'approved' },
  { id: reviewId(3), property_id: propId(1), tenant_id: uid.arjun, rating: 3, comment: 'Decent but the geyser needs fixing.', is_verified_stay: false, status: 'pending' },
]
for (const r of reviews) {
  const { error } = await supabase.from('reviews').upsert(r, { onConflict: 'id' })
  if (error) throw new Error(`review ${r.id}: ${error.message}`)
}

await supabase.rpc('recompute_property_rating', { prop_id: propId(1) })
await supabase.rpc('recompute_property_rating', { prop_id: propId(2) })

console.log('Creating inquiries + a saved property...')

const { error: inq1 } = await supabase.from('inquiries').insert({
  property_id: propId(3), user_id: uid.ananya, name: 'Ananya Pillai', phone: '9876500003',
  move_in: '2026-09-01', message: 'Is this place verified yet? Looking to move in September.', status: 'new',
})
if (inq1) throw new Error(`inquiry 1: ${inq1.message}`)
await supabase.rpc('increment_inquiries', { prop_id: propId(3) })

const { error: inq2 } = await supabase.from('inquiries').insert({
  property_id: propId(3), name: 'Mohammed Rafi', phone: '9876511111', message: 'Do you allow bikes for parking?', status: 'new',
})
if (inq2) throw new Error(`inquiry 2: ${inq2.message}`)
await supabase.rpc('increment_inquiries', { prop_id: propId(3) })

await supabase.from('saved_properties').upsert({ user_id: uid.arjun, property_id: propId(2) }, { onConflict: 'user_id,property_id' })

console.log(`\nDone. Seeded ${properties.length} properties (${properties.filter((p) => p.status === 'verified').length} verified) across ${new Set(properties.map((p) => p.city)).size} cities, with ${bedLayout.length} beds total.`)
console.log('\nSeed accounts (password for all: ' + SEED_PASSWORD + '):\n')
for (const u of Object.values(users)) {
  console.log(`  ${u.role.padEnd(7)} ${u.email}`)
}
console.log(`
Notable test scenarios:
  - ${users.ananya.email}: has a pending booking (Sunrise Single) + an overdue active booking (Green Valley Triple)
  - ${users.arjun.email}: has a confirmed-but-unpaid booking (bed is locked, ready to pay in /payments)
  - ${users.divya.email}: active + paid tenant, and also earns referrer commission on Sunrise Men's PG
  - ${users.karthik.email}: active + paid tenant on Sunrise Men's PG, left the 5-star review
  - ${users.vishnu.email}: verified agent connected to Green Valley Co-living, earning bounty + recurring commission
  - ${users.pendingAgent.email}: unverified agent, sitting in the admin Agents approval queue
  - Budget Boys Hostel is 'pending' verification, with 2 inquiries waiting — for the admin Verification/Properties queues
`)
