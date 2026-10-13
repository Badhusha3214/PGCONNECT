import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase'
import { authMiddleware, requireRole } from '../middleware/auth'
import { verifyAccessToken } from '../lib/jwt'
import { sendEmail, escapeHtml } from '../lib/email'
import type { Env } from '../types'

export const inquiriesRouter = new Hono<Env>()

// POST /api/inquiries
inquiriesRouter.post('/', async (c) => {
  const supabase = getSupabase(c.env)
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  let userId: string | null = null

  if (token) {
    try {
      const user = await verifyAccessToken(token, c.env.SUPABASE_URL)
      userId = user.id
    } catch {
      userId = null
    }
  }

  const { property_id, name, phone, move_in, message } = await c.req.json()
  if (!property_id || !name || !phone) {
    return c.json({ success: false, message: 'property_id, name, and phone are required' }, 400)
  }

  const { data, error } = await supabase
    .from('inquiries')
    .insert({ property_id, user_id: userId, name, phone, move_in, message })
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)

  const { error: incrementError } = await supabase.rpc('increment_inquiries', { prop_id: property_id })
  if (incrementError) console.error('[inquiries] increment_inquiries failed:', incrementError.message)

  // Email the owner in the background so the tenant's request isn't slowed.
  c.executionCtx.waitUntil(notifyOwner(c.env, supabase, property_id, { name, phone, move_in, message }))

  return c.json({ success: true, message: 'Inquiry sent!', inquiry: data }, 201)
})

const notifyOwner = async (
  env: Env['Bindings'],
  supabase: ReturnType<typeof getSupabase>,
  propertyId: string,
  inquiry: { name: string; phone: string; move_in?: string; message?: string }
) => {
  const { data: property } = await supabase
    .from('properties')
    .select('name, owner_id, owner:profiles!properties_owner_id_fkey(first_name)')
    .eq('id', propertyId)
    .single()
  if (!property) return
  const { data: owner } = await supabase.auth.admin.getUserById(property.owner_id)
  const to = owner?.user?.email
  if (!to) return

  const ownerName = (property.owner as { first_name?: string } | null)?.first_name
  const row = (label: string, value?: string) =>
    value ? `<tr><td style="padding:4px 12px 4px 0;color:#666">${label}</td><td style="padding:4px 0"><b>${escapeHtml(value)}</b></td></tr>` : ''

  await sendEmail(env, {
    to,
    subject: `New inquiry for ${property.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:520px">
        <p>Hi ${escapeHtml(ownerName || 'there')},</p>
        <p>You have a new inquiry for <b>${escapeHtml(property.name)}</b> on PGCON.</p>
        <table>${row('Name', inquiry.name)}${row('Phone', inquiry.phone)}${row('Move-in', inquiry.move_in)}${row('Message', inquiry.message)}</table>
        <p><a href="${escapeHtml(env.CLIENT_URL)}/ownersDashboard" style="color:#1D4ED8">View it in your dashboard</a></p>
        <p style="color:#888;font-size:12px">Reply to the tenant quickly — fast responses fill beds.</p>
      </div>`,
  })
}

// GET /api/inquiries/owner
inquiriesRouter.get('/owner', authMiddleware, requireRole('owner', 'admin'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)

  const { data: myProps } = await supabase.from('properties').select('id').eq('owner_id', user.id)
  const propIds = myProps?.map((p: { id: string }) => p.id) ?? []

  if (!propIds.length) return c.json({ success: true, count: 0, inquiries: [] })

  const { data, error } = await supabase
    .from('inquiries')
    .select('*, properties(id, name, city)')
    .in('property_id', propIds)
    .order('created_at', { ascending: false })

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, count: data?.length ?? 0, inquiries: data ?? [] })
})

// PATCH /api/inquiries/:id
inquiriesRouter.patch('/:id', authMiddleware, requireRole('owner', 'admin'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const { status } = await c.req.json()
  if (!['new', 'contacted', 'closed'].includes(status)) {
    return c.json({ success: false, message: 'Invalid status' }, 400)
  }

  if (user.role !== 'admin') {
    const { data: inquiry } = await supabase
      .from('inquiries')
      .select('properties!inner(owner_id)')
      .eq('id', c.req.param('id'))
      .maybeSingle()
    const ownerId = (inquiry?.properties as { owner_id?: string } | null)?.owner_id
    if (ownerId !== user.id) return c.json({ success: false, message: 'Inquiry not found' }, 404)
  }

  const { data, error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', c.req.param('id'))
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, message: 'Inquiry updated', inquiry: data })
})
