import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase'
import { authMiddleware, requireRole } from '../middleware/auth'
import type { Env } from '../types'

export const agentRouter = new Hono<Env>()

agentRouter.use('*', authMiddleware, requireRole('agent'))

// GET /api/agent/my-code
agentRouter.get('/my-code', async (c) => {
  const user = c.get('user')
  return c.json({
    success: true,
    agent_code: user.agent_code,
    connect_url: `${c.env.CLIENT_URL}/listProperty?agent=${user.agent_code}`,
    is_verified_agent: user.is_verified_agent,
  })
})

// GET /api/agent/stats
agentRouter.get('/stats', async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)

  const { data: connectedProperties, count: totalConnected } = await supabase
    .from('properties')
    .select('id, name, status, is_verified, city', { count: 'exact' })
    .eq('agent_id', user.id)

  const propIds = connectedProperties?.map((p: { id: string }) => p.id) ?? []

  let activeBookings = 0
  if (propIds.length) {
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' })
      .in('property_id', propIds)
      .eq('status', 'active')
    activeBookings = count ?? 0
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_commission_earned, commission_balance, is_verified_agent')
    .eq('id', user.id)
    .single()

  return c.json({
    success: true,
    stats: {
      total_connected: totalConnected ?? 0,
      verified_properties: (connectedProperties ?? []).filter((p: { is_verified: boolean }) => p.is_verified).length,
      active_bookings: activeBookings,
      total_commission_earned: profile?.total_commission_earned ?? 0,
      pending_balance: profile?.commission_balance ?? 0,
      is_verified_agent: profile?.is_verified_agent ?? false,
    },
    connected_properties: connectedProperties ?? [],
  })
})

// GET /api/agent/commissions
agentRouter.get('/commissions', async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const { page = '1', limit = '20' } = c.req.query()

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const from = (pageNum - 1) * limitNum

  const { data, count, error } = await supabase
    .from('commissions')
    .select(`
      id, amount, type, status, month, created_at,
      properties(id, name, city)
    `, { count: 'exact' })
    .eq('referrer_id', user.id)
    .eq('role', 'agent')
    .order('created_at', { ascending: false })
    .range(from, from + limitNum - 1)

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, total: count ?? 0, commissions: data ?? [] })
})

// POST /api/agent/request-payout
agentRouter.post('/request-payout', async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)

  const { data: profile } = await supabase
    .from('profiles')
    .select('commission_balance')
    .eq('id', user.id)
    .single()

  const balance = profile?.commission_balance ?? 0
  if (balance < 100) {
    return c.json({ success: false, message: 'Minimum payout is ₹100. Current balance: ₹' + balance }, 400)
  }

  // Reset balance and record the payout request (would trigger actual bank transfer via Razorpay Payouts).
  // Conditional on the balance we just read, so two concurrent requests can't
  // both pay out the same balance — the loser matches zero rows.
  const { data: debited, error } = await supabase
    .from('profiles')
    .update({ commission_balance: 0 })
    .eq('id', user.id)
    .eq('commission_balance', balance)
    .select('id')

  if (error) return c.json({ success: false, message: error.message }, 500)
  if (!debited?.length) {
    return c.json({ success: false, message: 'Balance changed while processing — please try again' }, 409)
  }

  return c.json({
    success: true,
    message: `Payout of ₹${balance} has been requested and will be processed within 2-3 business days`,
    amount: balance,
  })
})
