import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase'
import { authMiddleware } from '../middleware/auth'
import type { Env } from '../types'

export const usersRouter = new Hono<Env>()

// PATCH /api/users/profile — update own profile
usersRouter.patch('/profile', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const body = await c.req.json()

  const allowed = ['first_name', 'last_name', 'phone', 'university', 'avatar']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 400)
  return c.json({ success: true, user: data })
})

// POST /api/users/save/:propertyId — toggle saved property
usersRouter.post('/save/:propertyId', authMiddleware, async (c) => {
  const user = c.get('user')
  const propertyId = c.req.param('propertyId')
  const supabase = getSupabase(c.env)

  const { data: existing } = await supabase
    .from('saved_properties')
    .select('*')
    .eq('user_id', user.id)
    .eq('property_id', propertyId)
    .single()

  if (existing) {
    await supabase.from('saved_properties').delete().eq('user_id', user.id).eq('property_id', propertyId)
    const { error: adjustError } = await supabase.rpc('adjust_property_saves', { prop_id: propertyId, delta: -1 })
    if (adjustError) console.error('[users/save] adjust_property_saves failed:', adjustError.message)
    return c.json({ success: true, saved: false, message: 'Property removed from saved list' })
  }

  await supabase.from('saved_properties').insert({ user_id: user.id, property_id: propertyId })
  const { error: adjustError } = await supabase.rpc('adjust_property_saves', { prop_id: propertyId, delta: 1 })
  if (adjustError) console.error('[users/save] adjust_property_saves failed:', adjustError.message)
  return c.json({ success: true, saved: true, message: 'Property saved' })
})

// GET /api/users/saved — list saved properties
usersRouter.get('/saved', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)

  const { data } = await supabase
    .from('saved_properties')
    .select('properties(id, name, address, city, starting_price, status, is_verified)')
    .eq('user_id', user.id)

  return c.json({ success: true, properties: data?.map((s: Record<string, unknown>) => s.properties) ?? [] })
})
