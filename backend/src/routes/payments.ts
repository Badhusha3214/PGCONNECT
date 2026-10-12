import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase'
import { authMiddleware, requireRole } from '../middleware/auth'
import { AGENT_RECURRING_RATE } from '../lib/commission'
import { reclaimOrExtendBed, occupyBed, releaseBed, claimBedForRoom } from '../lib/beds'
import { razorpayRequest, verifyRazorpaySignature } from '../lib/razorpay'
import { settleListingPayment } from './listing'
import type { Env } from '../types'

export const paymentsRouter = new Hono<Env>()

// POST /api/payments/create-order — tenant initiates monthly rent payment
paymentsRouter.post('/create-order', authMiddleware, requireRole('student'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const { booking_id } = await c.req.json()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, properties(id, name, referred_by, commission_option)')
    .eq('id', booking_id)
    .eq('tenant_id', user.id)
    .single()

  if (!booking) return c.json({ success: false, message: 'Booking not found' }, 404)
  if (!['confirmed', 'active'].includes(booking.status)) {
    return c.json({ success: false, message: 'Booking is not active' }, 400)
  }
  if (!booking.bed_id) {
    return c.json({ success: false, message: 'No bed is reserved for this booking yet — ask the owner to confirm it first' }, 400)
  }

  // First month's payment: the bed is still 'locked' from the owner-confirm
  // step, so re-lock it (extends the hold) for the Razorpay checkout window.
  // From month 2 onward the booking is already 'active' and the bed is
  // permanently 'occupied' — nothing to (re)lock.
  if (booking.status === 'confirmed') {
    const relocked = await reclaimOrExtendBed(supabase, booking.bed_id, user.id, booking.id)
    if (!relocked) {
      return c.json({ success: false, message: 'Your reserved bed is no longer available. Please contact the owner.' }, 409)
    }
  }

  const order = await razorpayRequest(c.env, '/orders', 'POST', {
    amount: Math.round(booking.monthly_rent * 100),
    currency: 'INR',
    receipt: `booking_${booking_id}_${Date.now()}`,
    notes: { booking_id, property_name: (booking.properties as { name: string })?.name },
  })

  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      booking_id,
      tenant_id: user.id,
      property_id: booking.property_id,
      amount: booking.monthly_rent,
      razorpay_order_id: order.id,
      status: 'created',
      month: new Date().toISOString().slice(0, 7) + '-01',
    })
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)

  return c.json({
    success: true,
    order_id: order.id,
    payment_id: payment.id,
    amount: booking.monthly_rent,
    currency: 'INR',
    key_id: c.env.RAZORPAY_KEY_ID,
  })
})

// POST /api/payments/verify — called after Razorpay checkout completes
paymentsRouter.post('/verify', authMiddleware, requireRole('student'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } = await c.req.json()

  const valid = await verifyRazorpaySignature(
    c.env.RAZORPAY_KEY_SECRET,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  )
  if (!valid) return c.json({ success: false, message: 'Invalid payment signature' }, 400)

  const { data: payment } = await supabase
    .from('payments')
    .select('*, bookings(monthly_rent, property_id, bed_id, room_type, properties(referred_by, commission_option, agent_id))')
    .eq('id', payment_id)
    .eq('tenant_id', user.id)
    .single()

  if (!payment) return c.json({ success: false, message: 'Payment record not found' }, 404)

  const rent = payment.amount as number
  const platformFee = rent * 0.05
  const referrerCommission = rent * 0.02
  const ownerPayout = rent * 0.95

  const bookingInfo = payment.bookings as {
    property_id: string; bed_id: string | null; room_type: string
    properties: { referred_by: string | null; commission_option: string; agent_id: string | null }
  }
  const property = bookingInfo?.properties
  const referredBy = property?.referred_by ?? null
  const commissionOption = property?.commission_option ?? 'recurring'
  const agentId = property?.agent_id ?? null
  const agentCommission = agentId ? rent * AGENT_RECURRING_RATE : 0
  const platformRevenue = platformFee - referrerCommission - agentCommission

  await supabase.from('payments').update({
    razorpay_payment_id,
    status: 'paid',
    platform_fee: platformFee,
    referrer_commission: referrerCommission,
    agent_commission: agentCommission,
    platform_revenue: platformRevenue,
    owner_payout: ownerPayout,
  }).eq('id', payment_id)

  await supabase.from('bookings').update({ payment_status: 'paid', status: 'active' }).eq('id', payment.booking_id)

  // Money is already captured by Razorpay at this point — the tenant must
  // never see a failure past here, even if the bed's hold somehow lapsed.
  if (bookingInfo?.bed_id) {
    let occupied = await occupyBed(supabase, bookingInfo.bed_id, payment.booking_id)
    let finalBedId = bookingInfo.bed_id

    if (!occupied) {
      const { data: room } = await supabase
        .from('property_rooms')
        .select('id')
        .eq('property_id', bookingInfo.property_id)
        .eq('type', bookingInfo.room_type)
        .single()
      const fallbackBed = room ? await claimBedForRoom(supabase, room.id, user.id, payment.booking_id) : null
      if (fallbackBed) {
        occupied = await occupyBed(supabase, fallbackBed.id, payment.booking_id)
        finalBedId = fallbackBed.id
      }
    }

    if (occupied) {
      await supabase.from('bookings').update({ bed_id: finalBedId }).eq('id', payment.booking_id)
    } else {
      const { data: currentBooking } = await supabase.from('bookings').select('notes').eq('id', payment.booking_id).single()
      const flag = '[AUTO-FLAG: bed conflict at payment verification — needs manual admin reassignment]'
      await supabase.from('bookings').update({ notes: [currentBooking?.notes, flag].filter(Boolean).join(' ') }).eq('id', payment.booking_id)
    }
  }

  const creditCommission = async (opts: {
    earnerId: string
    role: 'referrer' | 'agent'
    amount: number
    type: 'recurring' | 'one-time'
    onlyIfNotAlreadyPaid: boolean
  }) => {
    if (opts.onlyIfNotAlreadyPaid) {
      const { count } = await supabase
        .from('commissions')
        .select('id', { count: 'exact' })
        .eq('referrer_id', opts.earnerId)
        .eq('property_id', payment.property_id)
        .eq('role', opts.role)
        .eq('status', 'paid')
      if ((count ?? 0) > 0) return
    }

    await supabase.from('commissions').insert({
      referrer_id: opts.earnerId,
      property_id: payment.property_id,
      payment_id,
      amount: opts.amount,
      type: opts.type,
      role: opts.role,
      status: 'pending',
      month: payment.month,
    })

    const { data: earnerProfile } = await supabase
      .from('profiles')
      .select('commission_balance, total_commission_earned')
      .eq('id', opts.earnerId)
      .single()

    if (earnerProfile) {
      await supabase.from('profiles').update({
        commission_balance: (earnerProfile.commission_balance ?? 0) + opts.amount,
        total_commission_earned: (earnerProfile.total_commission_earned ?? 0) + opts.amount,
      }).eq('id', opts.earnerId)
    }
  }

  if (referredBy) {
    await creditCommission({
      earnerId: referredBy,
      role: 'referrer',
      amount: referrerCommission,
      type: commissionOption as 'recurring' | 'one-time',
      onlyIfNotAlreadyPaid: commissionOption === 'one-time',
    })
  }

  if (agentId) {
    await creditCommission({
      earnerId: agentId,
      role: 'agent',
      amount: agentCommission,
      type: 'recurring',
      onlyIfNotAlreadyPaid: false,
    })
  }

  return c.json({ success: true, message: 'Payment verified and recorded', owner_payout: ownerPayout })
})

// GET /api/payments/history — tenant
paymentsRouter.get('/history', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)

  const { data, error } = await supabase
    .from('payments')
    .select('*, properties(name, city), bookings(room_type)')
    .eq('tenant_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, payments: data ?? [] })
})

// GET /api/payments/owner-payouts
paymentsRouter.get('/owner-payouts', authMiddleware, requireRole('owner'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)

  const { data: myProps } = await supabase.from('properties').select('id').eq('owner_id', user.id)
  const propIds = myProps?.map((p: { id: string }) => p.id) ?? []
  if (!propIds.length) return c.json({ success: true, payouts: [], total: 0 })

  const { data, error } = await supabase
    .from('payments')
    .select('*, properties(name, city), bookings(room_type, tenant:profiles!bookings_tenant_id_fkey(first_name, last_name))')
    .in('property_id', propIds)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  if (error) return c.json({ success: false, message: error.message }, 500)
  const total = (data ?? []).reduce((s: number, p: { owner_payout: number }) => s + (p.owner_payout ?? 0), 0)
  return c.json({ success: true, payouts: data ?? [], total })
})

// POST /api/payments/webhook — Razorpay webhook
paymentsRouter.post('/webhook', async (c) => {
  const signature = c.req.header('X-Razorpay-Signature') ?? ''
  const rawBody = await c.req.text()

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(c.env.RAZORPAY_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const generated = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')

  if (generated !== signature) return c.json({ error: 'Invalid signature' }, 400)

  const event = JSON.parse(rawBody)
  const entity = event.payload?.payment?.entity

  // Listing-fee orders: settle on capture (covers owners who close the tab
  // before the client-side verify call), mark failed on failure. Identified
  // by order id — Razorpay doesn't reliably copy order notes onto payments.
  const supabaseForListing = getSupabase(c.env)
  const { data: listingOrder } = entity?.order_id
    ? await supabaseForListing.from('listing_payments').select('id').eq('razorpay_order_id', entity.order_id).maybeSingle()
    : { data: null }
  if (listingOrder) {
    const supabase = supabaseForListing
    if (event.event === 'payment.captured') {
      await settleListingPayment(supabase, entity.order_id, entity.id)
    } else if (event.event === 'payment.failed') {
      await supabase.from('listing_payments').update({ status: 'failed' }).eq('razorpay_order_id', entity.order_id).eq('status', 'created')
    }
    return c.json({ success: true })
  }

  if (event.event === 'payment.failed') {
    const supabase = getSupabase(c.env)
    const orderId = event.payload?.payment?.entity?.order_id
    if (orderId) {
      const { data: failedPayment } = await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', orderId)
        .select('booking_id')
        .single()

      // Only release the bed if this was a first-payment attempt (booking
      // still 'confirmed', never made it to 'active') — a failed later
      // month's rent shouldn't evict an already-occupying tenant.
      if (failedPayment?.booking_id) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('status, bed_id')
          .eq('id', failedPayment.booking_id)
          .single()
        if (booking?.status === 'confirmed' && booking.bed_id) {
          await releaseBed(supabase, booking.bed_id, failedPayment.booking_id)
        }
      }
    }
  }

  return c.json({ success: true })
})
