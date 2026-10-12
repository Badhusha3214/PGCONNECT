import { Hono } from 'hono'
import { getSupabase } from '../lib/supabase'
import { authMiddleware, requireRole } from '../middleware/auth'
import { uploadToR2, deleteFromR2 } from '../lib/r2'
import type { Env } from '../types'

export const kycRouter = new Hono<Env>()

const DOC_TYPES = ['aadhaar', 'pan', 'driving_license', 'passport', 'property_proof'] as const
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_BYTES = 5 * 1024 * 1024
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

kycRouter.use('*', authMiddleware)

// POST /api/kyc — owner uploads one document (multipart: doc_type, file)
kycRouter.post('/', requireRole('owner'), async (c) => {
  const user = c.get('user')
  const form = await c.req.formData()
  const docType = String(form.get('doc_type') ?? '')
  const file = form.get('file') as unknown

  if (!DOC_TYPES.includes(docType as (typeof DOC_TYPES)[number])) {
    return c.json({ success: false, message: 'Choose a valid document type' }, 400)
  }
  if (!(file instanceof File)) return c.json({ success: false, message: 'Attach a file' }, 400)
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return c.json({ success: false, message: 'Only PDF, JPG, PNG or WebP files are accepted' }, 400)
  if (file.size > MAX_BYTES) return c.json({ success: false, message: 'File must be 5 MB or smaller' }, 400)

  const key = `kyc/${user.id}/${crypto.randomUUID()}.${ext}`
  await uploadToR2(c.env.R2, key, await file.arrayBuffer(), file.type)

  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('owner_kyc_documents')
    .insert({
      owner_id: user.id,
      doc_type: docType,
      r2_key: key,
      file_name: file.name.slice(0, 200),
      content_type: file.type,
      size_bytes: file.size,
    })
    .select('id, doc_type, file_name, status, rejection_reason, created_at')
    .single()

  if (error) {
    await deleteFromR2(c.env.R2, [key])
    return c.json({ success: false, message: error.message }, 500)
  }
  return c.json({ success: true, message: 'Document uploaded — we will review it shortly', document: data }, 201)
})

// GET /api/kyc/mine — owner's own documents (never exposes the R2 key)
kycRouter.get('/mine', requireRole('owner'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('owner_kyc_documents')
    .select('id, doc_type, file_name, size_bytes, status, rejection_reason, created_at, reviewed_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, documents: data ?? [] })
})

// GET /api/kyc/admin/queue?status=pending — admin review list
kycRouter.get('/admin/queue', requireRole('admin'), async (c) => {
  const supabase = getSupabase(c.env)
  const status = c.req.query('status') ?? 'pending'
  const { data, error } = await supabase
    .from('owner_kyc_documents')
    .select('id, doc_type, file_name, size_bytes, status, rejection_reason, created_at, reviewed_at, owner:profiles!owner_kyc_documents_owner_id_fkey(id, first_name, last_name, phone, is_verified_owner)')
    .eq('status', status)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, documents: data ?? [] })
})

// GET /api/kyc/:id/file — stream the file to its owner or an admin only
kycRouter.get('/:id/file', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  if (!UUID_RE.test(id)) return c.json({ success: false, message: 'Not found' }, 404)

  const supabase = getSupabase(c.env)
  const { data: doc } = await supabase
    .from('owner_kyc_documents')
    .select('owner_id, r2_key, content_type, file_name')
    .eq('id', id)
    .maybeSingle()
  if (!doc || (doc.owner_id !== user.id && user.role !== 'admin')) {
    return c.json({ success: false, message: 'Not found' }, 404)
  }

  const object = await c.env.R2.get(doc.r2_key)
  if (!object) return c.json({ success: false, message: 'File missing' }, 404)

  return new Response(object.body, {
    headers: {
      'Content-Type': doc.content_type,
      'Content-Disposition': `inline; filename="${doc.file_name.replace(/[^\w.\- ]/g, '_')}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
})

// DELETE /api/kyc/:id — owner removes a document that isn't approved yet
kycRouter.delete('/:id', requireRole('owner'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const { data: doc } = await supabase
    .from('owner_kyc_documents')
    .select('id, r2_key, status')
    .eq('id', c.req.param('id'))
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!doc) return c.json({ success: false, message: 'Not found' }, 404)
  if (doc.status === 'approved') return c.json({ success: false, message: 'Approved documents cannot be removed' }, 400)

  await supabase.from('owner_kyc_documents').delete().eq('id', doc.id)
  await deleteFromR2(c.env.R2, [doc.r2_key])
  return c.json({ success: true, message: 'Document removed' })
})

// PATCH /api/kyc/:id/review — admin approves or rejects
kycRouter.patch('/:id/review', requireRole('admin'), async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const { action, reason } = await c.req.json()
  if (!['approve', 'reject'].includes(action)) {
    return c.json({ success: false, message: 'action must be approve or reject' }, 400)
  }
  if (action === 'reject' && !String(reason ?? '').trim()) {
    return c.json({ success: false, message: 'Give a reason so the owner knows what to fix' }, 400)
  }

  const { data: doc, error } = await supabase
    .from('owner_kyc_documents')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      rejection_reason: action === 'reject' ? String(reason).trim().slice(0, 500) : null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', c.req.param('id'))
    .select('id, owner_id, doc_type, status')
    .maybeSingle()
  if (error) return c.json({ success: false, message: error.message }, 500)
  if (!doc) return c.json({ success: false, message: 'Not found' }, 404)

  // An approved identity document makes the owner a verified owner.
  if (doc.status === 'approved' && doc.doc_type !== 'property_proof') {
    await supabase.from('profiles').update({ is_verified_owner: true }).eq('id', doc.owner_id)
  }

  return c.json({ success: true, message: `Document ${doc.status}`, document: doc })
})
