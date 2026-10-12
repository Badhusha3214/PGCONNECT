import type { Env } from '../types'

export const razorpayRequest = async (env: Env['Bindings'], path: string, method: string, body?: unknown) => {
  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json() as Promise<Record<string, unknown>>
}

export const verifyRazorpaySignature = async (
  secret: string,
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> => {
  const message = `${orderId}|${paymentId}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  const generated = Array.from(new Uint8Array(sigBytes)).map((b) => b.toString(16).padStart(2, '0')).join('')
  return generated === signature
}
