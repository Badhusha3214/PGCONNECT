import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { authRouter } from './routes/auth'
import { propertiesRouter } from './routes/properties'
import { usersRouter } from './routes/users'
import { bookingsRouter } from './routes/bookings'
import { adminRouter } from './routes/admin'
import { inquiriesRouter } from './routes/inquiries'
import { referralRouter } from './routes/referral'
import { agentRouter } from './routes/agent'
import { paymentsRouter } from './routes/payments'
import { reviewsRouter } from './routes/reviews'
import { listingRouter } from './routes/listing'
import { kycRouter } from './routes/kyc'
import type { Env } from './types'

const app = new Hono<Env>()

app.use('*', logger())
// PG photos are embedded by the frontend on another origin, so they must allow
// cross-origin loading; everything else keeps the strict same-origin default.
const strictHeaders = secureHeaders()
const photoHeaders = secureHeaders({ crossOriginResourcePolicy: 'cross-origin' })
app.use('*', (c, next) =>
  c.req.path.startsWith('/api/properties/images/') ? photoHeaders(c, next) : strictHeaders(c, next)
)
app.use('*', cors({
  origin: (origin, c) => {
    const allowed = c.env?.CLIENT_URL ?? 'http://localhost:3000'
    if (!origin || origin === allowed) return origin ?? allowed
    // Allow localhost variants during dev
    if (origin.startsWith('http://localhost:')) return origin
    return null
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
}))

app.route('/api/auth', authRouter)
app.route('/api/properties', propertiesRouter)
app.route('/api/users', usersRouter)
app.route('/api/bookings', bookingsRouter)
app.route('/api/admin', adminRouter)
app.route('/api/inquiries', inquiriesRouter)
app.route('/api/referral', referralRouter)
app.route('/api/agent', agentRouter)
app.route('/api/payments', paymentsRouter)
app.route('/api/reviews', reviewsRouter)
app.route('/api/listing', listingRouter)
app.route('/api/kyc', kycRouter)

app.get('/api/health', (c) =>
  c.json({ success: true, message: 'PGCON API is running', timestamp: new Date().toISOString() })
)

app.notFound((c) => c.json({ success: false, message: 'Route not found' }, 404))

app.onError((err, c) => {
  console.error('[Error]', err)
  // Don't echo internal error text (SQL/driver details) back to clients.
  return c.json({ success: false, message: 'Internal server error' }, 500)
})

export default app
