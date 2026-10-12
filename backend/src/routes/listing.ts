import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase'
import { authMiddleware, requireRole } from '../middleware/auth'
import { razorpayRequest, verifyRazorpaySignature } from '../lib/razorpay'
import { LISTING_FEE_INR, LISTING_PERIOD_MONTHS, FREE_LISTING_SLOTS, FREE_LISTING_MONTHS } from '../lib/listing'
import type { Env } from '../types'

export const listingRouter = new Hono<Env>()

type Supabase = ReturnType<typeof getSupabase>

// Marks a listing payment paid and extends the listing by one period. Guarded
// on status='created' so the client verify call and the webhook can both
// fire for the same order without extending twice.
export const settleListingPayment = async (
  supabase: Supabase,
  orderId: string,
  razorpayPaymentId: string
): Promise<{ settled: boolean }> => {
  const { data: row } = await supabase
    .from('listing_payments')
    .update({ status: 'paid', razorpay_payment_id: razorpayPaymentId })
    .eq('razorpay_order_id', orderId)
    .eq('status', 'created')
    .select('id, property_id')
    .maybeSingle()
  if (!row) return { settled: false }

  const { data: paidUntil, error } = await supabase.rpc('extend_listing', {
    prop_id: row.property_id,
    months: LISTING_PERIOD_MONTHS,
  })
  if (error) console.error('[listing] extend_listing failed:', error.message)

  await supabase.from('listing_payments').update({ period_end: paidUntil }).eq('id', row.id)
  return { settled: true }
}

// GET /api/listing/config — fee and how many free launch slots remain
listingRouter.get('/config', async (c) => {
  const supabase = getSupabase(c.env)
  const { count } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('free_listing_slot', true)
  return c.json({
    success: true,
    fee: LISTING_FEE_INR,
    period_months: LISTING_PERIOD_MONTHS,
    free_slots_total: FREE_LISTING_SLOTS,
    free_slots_left: Math.max(0, FREE_LISTING_SLOTS - (count ?? 0)),
    free_months: FREE_LISTING_MONTHS,
  })
})

// POST /api/listing/:propertyId/create-order — owner pays / renews the listing
listingRouter.post('/:propertyId/create-order', authMiddleware, requireRole('owner'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const propertyId = c.req.param('propertyId')

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, listing_paid_until')
    .eq('id', propertyId)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!property) return c.json({ success: false, message: 'Property not found' }, 404)

  const order = await razorpayRequest(c.env, '/orders', 'POST', {
    amount: LISTING_FEE_INR * 100,
    currency: 'INR',
    receipt: `listing_${propertyId.slice(0, 8)}_${Date.now()}`,
    notes: { kind: 'listing_fee', property_id: propertyId, property_name: property.name },
  })
  if (!order.id) return c.json({ success: false, message: 'Could not start payment. Please try again.' }, 502)

  const stillPaid = property.listing_paid_until && new Date(property.listing_paid_until) > new Date()
  const { error } = await supabase.from('listing_payments').insert({
    property_id: propertyId,
    owner_id: user.id,
    amount: LISTING_FEE_INR,
    razorpay_order_id: order.id,
    status: 'created',
    period_start: stillPaid ? property.listing_paid_until : new Date().toISOString(),
  })
  if (error) return c.json({ success: false, message: error.message }, 500)

  return c.json({
    success: true,
    order_id: order.id,
    amount: LISTING_FEE_INR,
    currency: 'INR',
    key_id: c.env.RAZORPAY_KEY_ID,
  })
})

// POST /api/listing/verify — called after Razorpay checkout completes
listingRouter.post('/verify', authMiddleware, requireRole('owner'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await c.req.json()

  const valid = await verifyRazorpaySignature(c.env.RAZORPAY_KEY_SECRET, razorpay_order_id, razorpay_payment_id, razorpay_signature)
  if (!valid) return c.json({ success: false, message: 'Invalid payment signature' }, 400)

  const { data: payment } = await supabase
    .from('listing_payments')
    .select('id, property_id')
    .eq('razorpay_order_id', razorpay_order_id)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!payment) return c.json({ success: false, message: 'Payment record not found' }, 404)

  const { settled } = await settleListingPayment(supabase, razorpay_order_id, razorpay_payment_id)
  const { data: property } = await supabase
    .from('properties')
    .select('listing_paid_until')
    .eq('id', payment.property_id)
    .single()

  return c.json({
    success: true,
    message: settled ? 'Listing fee paid — thank you!' : 'Payment already recorded',
    listing_paid_until: property?.listing_paid_until ?? null,
  })
})
