import type { Env } from '../types'

export const escapeHtml = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!)

// Sends through Resend (https://resend.com). Without RESEND_API_KEY it logs
// and skips, so local dev and preview deploys work with no email setup.
// Never throws — a failed notification must not fail the user's request.
export const sendEmail = async (
  env: Env['Bindings'],
  msg: { to: string; subject: string; html: string; replyTo?: string }
): Promise<boolean> => {
  if (!env.RESEND_API_KEY) {
    console.log(`[email] RESEND_API_KEY not set — skipped "${msg.subject}"`)
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'PG Connect <onboarding@resend.dev>',
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      }),
    })
    if (!res.ok) console.error('[email] Resend rejected:', res.status, await res.text())
    return res.ok
  } catch (err) {
    console.error('[email] send failed:', err)
    return false
  }
}
