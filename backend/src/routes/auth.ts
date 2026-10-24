import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getSupabase } from '../lib/supabase'
import { authMiddleware } from '../middleware/auth'
import { generateReferralCode } from '../lib/referral'
import type { Env } from '../types'

export const authRouter = new Hono<Env>()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  role: z.enum(['student', 'owner', 'agent']).default('student'),
  phone: z.string().optional(),
  university: z.string().optional(),
})

// Where the "Confirm your email" link lands after Supabase verifies it.
// Must also be listed under Supabase → Authentication → URL Configuration → Redirect URLs.
const confirmRedirect = (env: Env['Bindings']) =>
  `${(env.CLIENT_URL || 'https://www.pgcon.in').replace(/\/+$/, '')}/signin?confirmed=1`

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// POST /api/auth/register
authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, first_name, last_name, role, phone, university } = c.req.valid('json')
  const supabase = getSupabase(c.env)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: confirmRedirect(c.env) },
  })
  if (error || !data.user) {
    return c.json({ success: false, message: error?.message ?? 'Registration failed' }, 400)
  }
  // Supabase "fakes" a signup for an already-confirmed email (so accounts
  // can't be enumerated): the user comes back with no identities, no email sent.
  if ((data.user.identities?.length ?? 0) === 0) {
    return c.json({
      success: false,
      code: 'email_exists',
      message: 'An account with this email already exists. Log in, or use "Forgot password?" if you can\'t remember it.',
    }, 409)
  }

  // Signing up again with an email that was never confirmed just re-sends the
  // confirmation mail — the profile from the first attempt is still there.
  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', data.user.id).maybeSingle()
  if (existingProfile) {
    return c.json({
      success: true,
      needs_confirmation: true,
      message: 'This email is already registered but not confirmed yet. We have sent the confirmation email again.',
      user: { id: data.user.id, email },
    }, 200)
  }

  const agent_code = role === 'agent' ? generateReferralCode() : null

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    first_name,
    last_name,
    role,
    phone,
    university,
    agent_code,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id)
    return c.json({ success: false, message: 'Failed to create profile' }, 500)
  }

  // No session means Supabase is waiting for the user to click the email link.
  const needsConfirmation = !data.session
  return c.json({
    success: true,
    needs_confirmation: needsConfirmation,
    message: needsConfirmation
      ? 'Registration successful. Please check your email to confirm your account.'
      : 'Registration successful.',
    user: { id: data.user.id, email, first_name, last_name, role, agent_code },
    token: data.session?.access_token,
  }, 201)
})

// POST /api/auth/resend-confirmation — re-send the signup confirmation email.
// Always answers the same way so it can't be used to probe which emails exist.
authRouter.post('/resend-confirmation', zValidator('json', z.object({ email: z.string().email() })), async (c) => {
  const { email } = c.req.valid('json')
  const supabase = getSupabase(c.env)
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: confirmRedirect(c.env) },
  })
  if (error && /rate|seconds|too many/i.test(error.message)) {
    return c.json({ success: false, message: 'Please wait a minute before requesting another email.' }, 429)
  }
  if (error) console.error('[auth/resend-confirmation]', error.message)
  return c.json({ success: true, message: 'If this email has an unconfirmed account, a new confirmation link is on its way.' })
})

// POST /api/auth/login
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const supabase = getSupabase(c.env)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return c.json({ success: false, message: 'Invalid email or password' }, 401)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (!profile?.is_active) {
    return c.json({ success: false, message: 'Account has been disabled' }, 403)
  }

  await supabase
    .from('profiles')
    .update({ last_login: new Date().toISOString() })
    .eq('id', data.user.id)

  let responseData: Record<string, unknown> = { ...profile, email: data.user.email }

  if (profile.role === 'owner') {
    const { data: properties } = await supabase
      .from('properties')
      .select('id, name, is_verified')
      .eq('owner_id', data.user.id)
    responseData.properties = properties ?? []
  }

  return c.json({
    success: true,
    token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: responseData,
  })
})

// POST /api/auth/logout
authRouter.post('/logout', authMiddleware, async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '') ?? ''
  const supabase = getSupabase(c.env)
  await supabase.auth.admin.signOut(token)
  return c.json({ success: true, message: 'Logged out successfully' })
})

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  return c.json({ success: true, user })
})

// PATCH /api/auth/update-password
authRouter.patch('/update-password', authMiddleware, async (c) => {
  const { new_password } = await c.req.json()
  if (!new_password || new_password.length < 6) {
    return c.json({ success: false, message: 'Password must be at least 6 characters' }, 400)
  }

  const supabase = getSupabase(c.env)
  const { error } = await supabase.auth.admin.updateUserById(c.get('user').id, {
    password: new_password,
  })

  if (error) return c.json({ success: false, message: error.message }, 400)
  return c.json({ success: true, message: 'Password updated successfully' })
})
