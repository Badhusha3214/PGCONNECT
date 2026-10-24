import { supabase, getAuthToken } from '../../lib/supabase'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

// ── Errors users can act on ───────────────────────────────────────────────────
export const NETWORK_ERROR = "Couldn't reach PGCON. Check your internet connection and try again."

// Plain-language fallback for when the server didn't send a useful message.
const friendlyStatusMessage = (status) => {
  if (status === 401) return 'Your session has expired. Please log in again.'
  if (status === 403) return "You don't have permission to do that."
  if (status === 404) return "We couldn't find what you were looking for. It may have been removed."
  if (status === 413) return 'That upload is too large. Try fewer or smaller photos.'
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.'
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.'
  return 'Something went wrong. Please try again.'
}

// fetch + JSON with consistent, readable errors. Thrown errors carry
// .status, .code and .data so callers can react to specific cases.
const request = async (url, options = {}) => {
  let res
  try {
    res = await fetch(url, options)
  } catch {
    const err = new Error(NETWORK_ERROR)
    err.status = 0
    throw err
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // "Internal server error" is our generic 500 text — not useful to show.
    const serverMessage = data?.message && data.message !== 'Internal server error' ? data.message : null
    const err = new Error(serverMessage || friendlyStatusMessage(res.status))
    err.status = res.status
    err.code = data?.code
    err.data = data
    throw err
  }
  return data
}

// ── Authenticated fetch helper ────────────────────────────────────────────────
const authFetch = async (path, options = {}) => {
  const token = await getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  }
  return request(`${BASE_URL}${path}`, { ...options, headers })
}

const authFetchForm = async (path, formData) => {
  const token = await getAuthToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  return request(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData })
}

// ── AUTH (Supabase client-side) ───────────────────────────────────────────────
export const userRegister = async ({ email, password, first_name, last_name, role, phone, university }) => {
  // Step 1: register with Supabase Auth + create profile via backend
  const data = await request(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, first_name, last_name, role, phone, university }),
  })

  // Step 2: sign in to get session (only when no email confirmation is required)
  if (data.token) {
    await supabase.auth.setSession({ access_token: data.token, refresh_token: data.token })
  }
  return data
}

export const resendConfirmation = async (email) => {
  return request(`${BASE_URL}/api/auth/resend-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

// Supabase's auth errors, reworded for people rather than developers.
const loginErrorMessage = (error) => {
  if (error.code === 'invalid_credentials' || /invalid login credentials/i.test(error.message)) {
    return 'Incorrect email or password. Check for typos, or use "Forgot password?" to reset it.'
  }
  if (/fetch|network/i.test(error.message)) return NETWORK_ERROR
  if (error.status === 429 || /rate limit|too many/i.test(error.message)) {
    return 'Too many login attempts. Please wait a few minutes and try again.'
  }
  return error.message
}

export const userLogin = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const unconfirmed = error.code === 'email_not_confirmed' || /not confirmed/i.test(error.message)
    const err = new Error(loginErrorMessage(error))
    err.code = unconfirmed ? 'email_not_confirmed' : error.code
    throw err
  }

  // fetch profile from backend
  const profile = await authFetch('/api/auth/me')
  return { ...data, user: profile.user }
}

export const logout = async () => {
  await supabase.auth.signOut()
  return { success: true }
}

// `options` can carry a fetch `signal` (e.g. a timeout) for callers that
// mustn't wait forever.
export const getCurrentUser = async (options = {}) => {
  return authFetch('/api/auth/me', options)
}

export const updatePassword = async ({ new_password }) => {
  return authFetch('/api/auth/update-password', {
    method: 'PATCH',
    body: JSON.stringify({ new_password }),
  })
}

// ── PROPERTIES ────────────────────────────────────────────────────────────────
export const getAllProperties = async (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return fetch(`${BASE_URL}/api/properties${qs ? '?' + qs : ''}`).then((r) => r.json())
}

export const getPropertyById = async (propertyId) => {
  return fetch(`${BASE_URL}/api/properties/${propertyId}`).then((r) => r.json())
}

export const createProperty = async (formData) => {
  return authFetchForm('/api/properties', formData)
}

// Agent/admin: create a new owner's account and their PG in one go.
export const onboardProperty = async (formData) => {
  return authFetchForm('/api/properties/onboard', formData)
}

export const updateProperty = async (propertyId, data) => {
  return authFetch(`/api/properties/${propertyId}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export const deleteProperty = async (propertyId) => {
  return authFetch(`/api/properties/${propertyId}`, { method: 'DELETE' })
}

export const addPropertyPhotos = async (propertyId, files) => {
  const form = new FormData()
  files.forEach((f) => form.append('images', f))
  return authFetchForm(`/api/properties/${propertyId}/images`, form)
}

export const deletePropertyPhoto = async (propertyId, imageId) => {
  return authFetch(`/api/properties/${propertyId}/images/${imageId}`, { method: 'DELETE' })
}

// imageIds in display order; the first becomes the cover photo.
export const reorderPropertyPhotos = async (propertyId, imageIds) => {
  return authFetch(`/api/properties/${propertyId}/images/order`, {
    method: 'PATCH',
    body: JSON.stringify({ image_ids: imageIds }),
  })
}

export const getOwnerProperties = async () => {
  return authFetch('/api/properties/owner/mine')
}

// ── USERS ─────────────────────────────────────────────────────────────────────
export const saveProperty = async (propertyId) => {
  return authFetch(`/api/users/save/${propertyId}`, { method: 'POST' })
}

export const getSavedProperties = async () => {
  return authFetch('/api/users/saved')
}

export const updateProfile = async (profileData) => {
  return authFetch('/api/users/profile', { method: 'PATCH', body: JSON.stringify(profileData) })
}

// ── BOOKINGS ──────────────────────────────────────────────────────────────────
export const createBooking = async (bookingData) => {
  return authFetch('/api/bookings', { method: 'POST', body: JSON.stringify(bookingData) })
}

export const getMyBookings = async () => {
  return authFetch('/api/bookings/mine')
}

export const getOwnerBookings = async () => {
  return authFetch('/api/bookings/owner')
}

export const updateBooking = async (bookingId, updates) => {
  return authFetch(`/api/bookings/${bookingId}`, { method: 'PATCH', body: JSON.stringify(updates) })
}

// ── INQUIRIES ─────────────────────────────────────────────────────────────────
export const createInquiry = async (inquiryData) => {
  return authFetch('/api/inquiries', { method: 'POST', body: JSON.stringify(inquiryData) })
}

export const getOwnerInquiries = async () => {
  return authFetch('/api/inquiries/owner')
}

export const updateInquiryStatus = async (inquiryId, status) => {
  return authFetch(`/api/inquiries/${inquiryId}`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

// ── AGENT ─────────────────────────────────────────────────────────────────────
export const getAgentCode = async () => {
  return authFetch('/api/agent/my-code')
}

export const getAgentStats = async () => {
  return authFetch('/api/agent/stats')
}

export const getAgentCommissions = async (page = 1) => {
  return authFetch(`/api/agent/commissions?page=${page}`)
}

export const requestAgentPayout = async () => {
  return authFetch('/api/agent/request-payout', { method: 'POST' })
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
export const createPaymentOrder = async (booking_id) => {
  return authFetch('/api/payments/create-order', { method: 'POST', body: JSON.stringify({ booking_id }) })
}

export const verifyPayment = async (paymentData) => {
  return authFetch('/api/payments/verify', { method: 'POST', body: JSON.stringify(paymentData) })
}

export const getPaymentHistory = async () => {
  return authFetch('/api/payments/history')
}

export const getOwnerPayouts = async () => {
  return authFetch('/api/payments/owner-payouts')
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────
export const getPropertyReviews = async (propertyId, page = 1) => {
  return fetch(`${BASE_URL}/api/reviews/property/${propertyId}?page=${page}`).then((r) => r.json())
}

export const createReview = async ({ property_id, rating, comment }) => {
  return authFetch('/api/reviews', {
    method: 'POST',
    body: JSON.stringify({ property_id, rating, comment }),
  })
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
export const getAdminStats = async () => {
  return authFetch('/api/admin/stats')
}

export const getVerificationQueue = async (status = 'pending', page = 1) => {
  return authFetch(`/api/admin/verification-queue?status=${status}&page=${page}`)
}

export const getAdminProperties = async (sort = 'views', page = 1) => {
  return authFetch(`/api/admin/properties?sort=${sort}&page=${page}`)
}

export const verifyProperty = async (propertyId, action) => {
  return authFetch(`/api/admin/properties/${propertyId}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  })
}

export const getAdminUsers = async (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return authFetch(`/api/admin/users${qs ? '?' + qs : ''}`)
}

export const toggleUser = async (userId) => {
  return authFetch(`/api/admin/users/${userId}/toggle`, { method: 'PATCH' })
}

export const getAdminCommissions = async (page = 1) => {
  return authFetch(`/api/admin/commissions?page=${page}`)
}

export const getAdminPayments = async (page = 1) => {
  return authFetch(`/api/admin/payments?page=${page}`)
}

export const getAdminReviews = async (status = 'pending', page = 1) => {
  return authFetch(`/api/admin/reviews?status=${status}&page=${page}`)
}

export const moderateReview = async (reviewId, action) => {
  return authFetch(`/api/admin/reviews/${reviewId}/moderate`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  })
}

export const verifyAgent = async (agentId, action) => {
  return authFetch(`/api/admin/agents/${agentId}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  })
}

// ── LISTING FEE ───────────────────────────────────────────────────────────────
export const getListingConfig = async () => {
  const res = await fetch(`${BASE_URL}/api/listing/config`)
  return res.json()
}

export const createListingOrder = async (propertyId) => {
  return authFetch(`/api/listing/${propertyId}/create-order`, { method: 'POST' })
}

export const verifyListingPayment = async (paymentData) => {
  return authFetch('/api/listing/verify', { method: 'POST', body: JSON.stringify(paymentData) })
}

// ── OWNER KYC ─────────────────────────────────────────────────────────────────
export const uploadKycDocument = async (docType, file) => {
  const form = new FormData()
  form.append('doc_type', docType)
  form.append('file', file)
  return authFetchForm('/api/kyc', form)
}

export const getMyKycDocuments = async () => {
  return authFetch('/api/kyc/mine')
}

export const deleteKycDocument = async (docId) => {
  return authFetch(`/api/kyc/${docId}`, { method: 'DELETE' })
}

export const getKycQueue = async (status = 'pending') => {
  return authFetch(`/api/kyc/admin/queue?status=${encodeURIComponent(status)}`)
}

export const reviewKycDocument = async (docId, action, reason) => {
  return authFetch(`/api/kyc/${docId}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ action, reason }),
  })
}

// KYC files are private: fetched with the auth header and opened as a blob
// URL in a new tab — they are never reachable by a plain link.
export const openKycDocument = async (docId) => {
  const token = await getAuthToken()
  const res = await fetch(`${BASE_URL}/api/kyc/${docId}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Could not open document')
  const url = URL.createObjectURL(await res.blob())
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
