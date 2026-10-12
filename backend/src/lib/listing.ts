// Listing-fee policy. Change these numbers here — nothing else hardcodes them.
export const LISTING_FEE_INR = 1000 // charged per property, per period
export const LISTING_PERIOD_MONTHS = 12 // one paid period
export const FREE_LISTING_SLOTS = 250 // first N properties to go live…
export const FREE_LISTING_MONTHS = 12 // …get this long free

// A property is publicly visible only when it is verified AND its listing is
// paid up (free slot or fee). Every public, tenant-facing query must filter
// `.eq('status', 'verified').gt('listing_paid_until', nowIso())`.
export const nowIso = () => new Date().toISOString()

export const isListingLive = (p: { status?: string | null; listing_paid_until?: string | null }) =>
  p.status === 'verified' && !!p.listing_paid_until && new Date(p.listing_paid_until).getTime() > Date.now()
