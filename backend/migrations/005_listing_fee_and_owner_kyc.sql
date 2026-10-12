-- Migration 005 — annual listing fee (with free launch slots) + owner KYC.
-- Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE everywhere).

-- ─── LISTING FEE ─────────────────────────────────────────────────────────────
-- A verified property is publicly visible only while listing_paid_until is in
-- the future. The first N properties to go live get their first year free
-- (free_listing_slot); everyone renews at the annual fee after that.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_paid_until TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS free_listing_slot BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_properties_status_paid ON properties(status, listing_paid_until);

CREATE TABLE IF NOT EXISTS listing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listing_payments_property ON listing_payments(property_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_payments_order ON listing_payments(razorpay_order_id);
ALTER TABLE listing_payments ENABLE ROW LEVEL SECURITY;

-- Backfill: properties that are already live keep showing — they take the
-- earliest free slots, with a year counted from when they were verified
-- (and at least 30 days from now, so nothing vanishes the day this runs).
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(verified_at, created_at), id) AS rn
  FROM properties
  WHERE status = 'verified' AND listing_paid_until IS NULL AND NOT free_listing_slot
)
UPDATE properties p
SET free_listing_slot = TRUE,
    listing_paid_until = GREATEST(COALESCE(p.verified_at, p.created_at) + INTERVAL '1 year', NOW() + INTERVAL '30 days')
FROM ranked
WHERE p.id = ranked.id AND ranked.rn <= 250;

-- Atomically hand out a free slot when a property goes live. The advisory
-- lock serialises concurrent approvals so the slot count can't overshoot.
CREATE OR REPLACE FUNCTION claim_free_listing_slot(prop_id UUID, max_slots INT, free_months INT)
RETURNS BOOLEAN AS $$
DECLARE
  used INT;
  already BOOLEAN;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('free_listing_slot'));
  SELECT free_listing_slot INTO already FROM properties WHERE id = prop_id;
  IF already THEN RETURN TRUE; END IF;
  SELECT COUNT(*) INTO used FROM properties WHERE free_listing_slot;
  IF used >= max_slots THEN RETURN FALSE; END IF;
  UPDATE properties
  SET free_listing_slot = TRUE,
      listing_paid_until = GREATEST(COALESCE(listing_paid_until, NOW()), NOW()) + make_interval(months => free_months)
  WHERE id = prop_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Extend a listing by one paid period, from whichever is later: now or the
-- current expiry (so renewing early never loses remaining time).
CREATE OR REPLACE FUNCTION extend_listing(prop_id UUID, months INT)
RETURNS TIMESTAMPTZ AS $$
  UPDATE properties
  SET listing_paid_until = GREATEST(COALESCE(listing_paid_until, NOW()), NOW()) + make_interval(months => months)
  WHERE id = prop_id
  RETURNING listing_paid_until;
$$ LANGUAGE sql;

-- ─── OWNER KYC ───────────────────────────────────────────────────────────────
-- Files live in the private R2 bucket under kyc/<owner_id>/…; they are only
-- ever streamed through the authenticated API (owner or admin), never by URL.
CREATE TABLE IF NOT EXISTS owner_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('aadhaar', 'pan', 'driving_license', 'passport', 'property_proof')),
  r2_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_owner_kyc_owner ON owner_kyc_documents(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_owner_kyc_status ON owner_kyc_documents(status, created_at);
ALTER TABLE owner_kyc_documents ENABLE ROW LEVEL SECURITY;
