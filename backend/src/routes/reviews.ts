import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { getSupabase } from '../lib/supabase'
import { authMiddleware, requireRole } from '../middleware/auth'
import type { Env } from '../types'

export const reviewsRouter = new Hono<Env>()

// GET /api/reviews/featured — latest approved 4-5★ reviews with a comment, for the homepage
reviewsRouter.get('/featured', cache({ cacheName: 'pgconnect-reviews-featured', cacheControl: 'public, max-age=1800' }), async (c) => {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, is_verified_stay, created_at, tenant:profiles!reviews_tenant_id_fkey(first_name, last_name), property:properties(id, name, city)')
    .eq('status', 'approved')
    .gte('rating', 4)
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) return c.json({ success: false, message: error.message }, 500)
  // Only substantive reviews go on the homepage — skip one-word / test comments.
  const featured = (data ?? []).filter((r) => (r.comment ?? '').trim().length >= 30).slice(0, 3)
  return c.json({ success: true, reviews: featured })
})

// GET /api/reviews/property/:propertyId — public, approved reviews only
reviewsRouter.get('/property/:propertyId', cache({ cacheName: 'pgconnect-reviews', cacheControl: 'public, max-age=30' }), async (c) => {
  const supabase = getSupabase(c.env)
  const propertyId = c.req.param('propertyId')
  const { page = '1', limit = '10' } = c.req.query()
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const from = (pageNum - 1) * limitNum

  const { data, count, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, is_verified_stay, created_at, tenant:profiles!reviews_tenant_id_fkey(first_name, last_name)', { count: 'exact' })
    .eq('property_id', propertyId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, from + limitNum - 1)

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, total: count ?? 0, reviews: data ?? [] })
})

// POST /api/reviews — authenticated tenant submits a review
reviewsRouter.post('/', authMiddleware, requireRole('student'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const { property_id, rating, comment } = await c.req.json()

  if (!property_id || !rating || Number(rating) < 1 || Number(rating) > 5) {
    return c.json({ success: false, message: 'property_id and rating (1-5) are required' }, 400)
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id')
    .eq('property_id', property_id)
    .eq('tenant_id', user.id)
    .in('status', ['confirmed', 'active', 'completed'])
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      property_id,
      tenant_id: user.id,
      rating: Number(rating),
      comment: comment ?? null,
      is_verified_stay: !!booking,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return c.json({ success: false, message: "You've already reviewed this property." }, 409)
    }
    return c.json({ success: false, message: error.message }, 500)
  }

  return c.json({ success: true, message: 'Review submitted for moderation', review: data }, 201)
})
