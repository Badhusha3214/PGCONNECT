import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase'
import { authMiddleware, requireRole } from '../middleware/auth'
import { AGENT_BOUNTY_AMOUNT } from '../lib/commission'
import { orSafe } from '../lib/postgrest'
import { FREE_LISTING_SLOTS, FREE_LISTING_MONTHS } from '../lib/listing'
import type { Env } from '../types'

export const adminRouter = new Hono<Env>()

adminRouter.use('*', authMiddleware, requireRole('admin'))

// GET /api/admin/stats
adminRouter.get('/stats', async (c) => {
  const supabase = getSupabase(c.env)

  const [
    { count: totalUsers },
    { count: studentCount },
    { count: ownerCount },
    { count: agentCount },
    { count: pendingAgents },
    { count: totalProperties },
    { count: pendingVerifications },
    { count: activeListings },
    { count: totalBookings },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'owner').eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'agent').eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'agent').eq('is_verified_agent', false),
    supabase.from('properties').select('id', { count: 'exact', head: true }),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
  ])

  const { data: totals } = await supabase.rpc('payment_totals').single<{ platform_revenue: number }>()
  const totalRevenue = Number(totals?.platform_revenue ?? 0)

  return c.json({
    success: true,
    stats: {
      totalUsers: totalUsers ?? 0,
      studentCount: studentCount ?? 0,
      ownerCount: ownerCount ?? 0,
      agentCount: agentCount ?? 0,
      pendingAgents: pendingAgents ?? 0,
      totalProperties: totalProperties ?? 0,
      pendingVerifications: pendingVerifications ?? 0,
      activeListings: activeListings ?? 0,
      totalBookings: totalBookings ?? 0,
      totalRevenue,
    },
  })
})

// GET /api/admin/properties — all properties with engagement stats
adminRouter.get('/properties', async (c) => {
  const supabase = getSupabase(c.env)
  const { page = '1', limit = '20', sort = 'views' } = c.req.query()
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const from = (pageNum - 1) * limitNum

  const sortMap: Record<string, string> = {
    views: 'views',
    saves: 'saves_count',
    inquiries: 'inquiries_count',
    newest: 'created_at',
  }
  const sortColumn = sortMap[sort] ?? 'views'

  const { data, count, error } = await supabase
    .from('properties')
    .select(`
      id, name, city, status, views, saves_count, inquiries_count, created_at,
      owner:profiles!properties_owner_id_fkey(id, first_name, last_name)
    `, { count: 'exact' })
    .order(sortColumn, { ascending: false })
    .range(from, from + limitNum - 1)

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, total: count ?? 0, page: pageNum, properties: data ?? [] })
})

// GET /api/admin/verification-queue
adminRouter.get('/verification-queue', async (c) => {
  const supabase = getSupabase(c.env)
  const { status = 'pending', page = '1', limit = '20' } = c.req.query()
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const from = (pageNum - 1) * limitNum

  const { data, count, error } = await supabase
    .from('properties')
    .select(`
      id, name, city, address, status, created_at,
      owner:profiles!properties_owner_id_fkey(id, first_name, last_name, phone),
      property_images(image_url, position)
    `, { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: true })
    .order('position', { referencedTable: 'property_images', ascending: true })
    .range(from, from + limitNum - 1)

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, total: count ?? 0, page: pageNum, properties: data ?? [] })
})

// PATCH /api/admin/properties/:id/verify
adminRouter.patch('/properties/:id/verify', async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const { action } = await c.req.json()

  if (!['enable', 'disable'].includes(action)) {
    return c.json({ success: false, message: 'action must be enable or disable' }, 400)
  }

  const updates: Record<string, unknown> = {}
  if (action === 'enable') {
    updates.status = 'verified'
    updates.is_verified = true
    updates.verified_at = new Date().toISOString()
    updates.verified_by = user.id
    updates.rejection_reason = null
  } else {
    updates.status = 'unlisted'
    updates.is_verified = false
  }

  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', c.req.param('id'))
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)

  // Going live: hand out a free launch slot if any remain. Otherwise the
  // property stays hidden from search until the owner pays the listing fee.
  let freeSlot = false
  if (action === 'enable') {
    const { data: claimed, error: slotError } = await supabase.rpc('claim_free_listing_slot', {
      prop_id: data.id,
      max_slots: FREE_LISTING_SLOTS,
      free_months: FREE_LISTING_MONTHS,
    })
    if (slotError) console.error('[admin/verify] claim_free_listing_slot failed:', slotError.message)
    freeSlot = claimed === true
  }

  if (action === 'enable' && data.agent_id && !data.agent_bounty_paid) {
    const { data: agentProfile } = await supabase
      .from('profiles')
      .select('commission_balance, total_commission_earned')
      .eq('id', data.agent_id)
      .single()

    if (agentProfile) {
      await supabase.from('commissions').insert({
        referrer_id: data.agent_id,
        property_id: data.id,
        amount: AGENT_BOUNTY_AMOUNT,
        type: 'bounty',
        role: 'agent',
        status: 'pending',
        month: new Date().toISOString().slice(0, 7) + '-01',
      })

      await supabase.from('profiles').update({
        commission_balance: (agentProfile.commission_balance ?? 0) + AGENT_BOUNTY_AMOUNT,
        total_commission_earned: (agentProfile.total_commission_earned ?? 0) + AGENT_BOUNTY_AMOUNT,
      }).eq('id', data.agent_id)

      await supabase.from('properties').update({ agent_bounty_paid: true }).eq('id', data.id)
    }
  }

  const message = action !== 'enable'
    ? 'Property disabled'
    : freeSlot
      ? 'Property enabled — free launch listing applied'
      : 'Property enabled — it will appear in search once the owner pays the listing fee'
  return c.json({ success: true, message, property: data, free_listing_slot: freeSlot })
})

// PATCH /api/admin/agents/:id/verify
adminRouter.patch('/agents/:id/verify', async (c) => {
  const supabase = getSupabase(c.env)
  const { action } = await c.req.json()
  if (!['verify', 'unverify'].includes(action)) {
    return c.json({ success: false, message: 'action must be verify or unverify' }, 400)
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_verified_agent: action === 'verify' })
    .eq('id', c.req.param('id'))
    .eq('role', 'agent')
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, message: `Agent ${action === 'verify' ? 'approved' : 'unverified'}`, agent: data })
})

// GET /api/admin/users
adminRouter.get('/users', async (c) => {
  const supabase = getSupabase(c.env)
  const { role, page = '1', limit = '20', search } = c.req.query()
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const from = (pageNum - 1) * limitNum

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })

  if (role) query = query.eq('role', role)
  const term = search ? orSafe(search) : ''
  if (term) query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, from + limitNum - 1)

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, total: count ?? 0, page: pageNum, users: data ?? [] })
})

// PATCH /api/admin/users/:id/toggle
adminRouter.patch('/users/:id/toggle', async (c) => {
  const supabase = getSupabase(c.env)
  const { data: user } = await supabase.from('profiles').select('is_active').eq('id', c.req.param('id')).single()
  if (!user) return c.json({ success: false, message: 'User not found' }, 404)

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: !user.is_active })
    .eq('id', c.req.param('id'))
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, message: `User ${data.is_active ? 'activated' : 'deactivated'}`, user: data })
})

// GET /api/admin/commissions
adminRouter.get('/commissions', async (c) => {
  const supabase = getSupabase(c.env)
  const { page = '1', limit = '20', status } = c.req.query()
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const from = (pageNum - 1) * limitNum

  let query = supabase
    .from('commissions')
    .select(`
      *,
      referrer:profiles!commissions_referrer_id_fkey(id, first_name, last_name),
      properties(id, name, city)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query.range(from, from + limitNum - 1)
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, total: count ?? 0, commissions: data ?? [] })
})

// GET /api/admin/payments
adminRouter.get('/payments', async (c) => {
  const supabase = getSupabase(c.env)
  const { page = '1', limit = '20' } = c.req.query()
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const from = (pageNum - 1) * limitNum

  const { data, count, error } = await supabase
    .from('payments')
    .select(`
      *,
      properties(name, city),
      tenant:profiles!payments_tenant_id_fkey(first_name, last_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limitNum - 1)

  if (error) return c.json({ success: false, message: error.message }, 500)

  // Summed in SQL — pulling every paid row into the Worker doesn't scale.
  const { data: totals } = await supabase.rpc('payment_totals').single<Record<string, number>>()
  const summary = {
    platform_revenue: Number(totals?.platform_revenue ?? 0),
    owner_payouts: Number(totals?.owner_payouts ?? 0),
    referrer_commissions: Number(totals?.referrer_commissions ?? 0),
    agent_commissions: Number(totals?.agent_commissions ?? 0),
  }

  return c.json({ success: true, total: count ?? 0, payments: data ?? [], summary })
})

// GET /api/admin/reviews
adminRouter.get('/reviews', async (c) => {
  const supabase = getSupabase(c.env)
  const { status = 'pending', page = '1', limit = '20' } = c.req.query()
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const from = (pageNum - 1) * limitNum

  const { data, count, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, is_verified_stay, status, created_at,
      property:properties(id, name, city),
      tenant:profiles!reviews_tenant_id_fkey(id, first_name, last_name)
    `, { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: true })
    .range(from, from + limitNum - 1)

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, total: count ?? 0, reviews: data ?? [] })
})

// PATCH /api/admin/reviews/:id/moderate
adminRouter.patch('/reviews/:id/moderate', async (c) => {
  const supabase = getSupabase(c.env)
  const { action } = await c.req.json()

  if (!['approve', 'reject'].includes(action)) {
    return c.json({ success: false, message: 'action must be approve or reject' }, 400)
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected'
  const { data, error } = await supabase
    .from('reviews')
    .update({ status: newStatus })
    .eq('id', c.req.param('id'))
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)

  const { error: recomputeError } = await supabase.rpc('recompute_property_rating', { prop_id: data.property_id })
  if (recomputeError) console.error('[admin/reviews] recompute_property_rating failed:', recomputeError.message)

  return c.json({ success: true, message: `Review ${newStatus}`, review: data })
})
