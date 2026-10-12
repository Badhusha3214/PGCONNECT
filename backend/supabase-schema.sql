-- PG Connect — Supabase PostgreSQL Schema
-- Run this entire file once in the Supabase SQL editor.

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'owner', 'agent', 'admin')),
  phone TEXT,
  avatar TEXT,
  university TEXT,
  is_verified_owner BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified_agent BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  referral_code TEXT UNIQUE,
  agent_code TEXT UNIQUE,
  commission_type TEXT NOT NULL DEFAULT 'recurring' CHECK (commission_type IN ('recurring', 'one-time')),
  total_commission_earned NUMERIC NOT NULL DEFAULT 0,
  commission_balance NUMERIC NOT NULL DEFAULT 0,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROPERTIES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  agent_bounty_paid BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT NOT NULL,
  tagline TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  landmark TEXT,
  lat NUMERIC,
  lng NUMERIC,
  amenities TEXT[] DEFAULT '{}',
  gender TEXT DEFAULT 'Co-ed' CHECK (gender IN ('Boys', 'Girls', 'Co-ed')),
  starting_price NUMERIC NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 0,
  total_ratings INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'verified', 'rejected', 'unlisted')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  total_beds INT NOT NULL DEFAULT 0,
  available_beds INT NOT NULL DEFAULT 0,
  views INT NOT NULL DEFAULT 0,
  inquiries_count INT NOT NULL DEFAULT 0,
  saves_count INT NOT NULL DEFAULT 0,
  commission_option TEXT DEFAULT 'recurring' CHECK (commission_option IN ('recurring', 'one-time')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_referred_by ON properties(referred_by);
CREATE INDEX IF NOT EXISTS idx_properties_agent ON properties(agent_id);

-- ─── PROPERTY ROOMS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Single', 'Double', 'Triple')),
  price NUMERIC NOT NULL,
  total_beds INT NOT NULL DEFAULT 1,
  available_beds INT NOT NULL DEFAULT 1,
  description TEXT,
  image_key TEXT,
  image_url TEXT
);

-- ─── PROPERTY IMAGES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_key TEXT NOT NULL,
  image_url TEXT,
  position INT NOT NULL DEFAULT 0
);

-- ─── BOOKINGS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL CHECK (room_type IN ('Single', 'Double', 'Triple')),
  move_in_date DATE NOT NULL,
  move_out_date DATE,
  monthly_rent NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'overdue', 'processing')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);

-- ─── BEDS ────────────────────────────────────────────────────────────────────
-- The atomic bookable unit. Each property_rooms row is a room-TYPE bucket
-- (e.g. "Double" at ₹8000); each bed is one physical slot within that bucket.
CREATE TABLE IF NOT EXISTS beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES property_rooms(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Bed 1',
  status TEXT NOT NULL DEFAULT 'vacant'
    CHECK (status IN ('vacant', 'locked', 'occupied', 'notice-period')),
  locked_at TIMESTAMPTZ,
  locked_until TIMESTAMPTZ,
  locked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  current_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, label)
);

CREATE INDEX IF NOT EXISTS idx_beds_room ON beds(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_property_status ON beds(property_id, status);

-- bookings.bed_id added after beds exists (the two tables reference each other).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bed_id UUID REFERENCES beds(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_bed ON bookings(bed_id);

-- ─── INQUIRIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  move_in DATE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SAVED PROPERTIES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_properties (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, property_id)
);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  tenant_id UUID NOT NULL REFERENCES profiles(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC,
  referrer_commission NUMERIC,
  agent_commission NUMERIC,
  platform_revenue NUMERIC,
  owner_payout NUMERIC,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_property ON payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ─── COMMISSIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  payment_id UUID REFERENCES payments(id),
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('recurring', 'one-time', 'bounty')),
  role TEXT NOT NULL DEFAULT 'referrer' CHECK (role IN ('referrer', 'agent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_referrer ON commissions(referrer_id);

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified_stay BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- ─── HELPER FUNCTION: increment inquiries ────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_inquiries(prop_id UUID)
RETURNS void AS $$
  UPDATE properties SET inquiries_count = inquiries_count + 1 WHERE id = prop_id;
$$ LANGUAGE SQL;

-- ─── HELPER FUNCTION: recompute property rating from approved reviews ────────
CREATE OR REPLACE FUNCTION recompute_property_rating(prop_id UUID)
RETURNS void AS $$
  UPDATE properties SET
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE property_id = prop_id AND status = 'approved'), 0),
    total_ratings = (SELECT COUNT(*) FROM reviews WHERE property_id = prop_id AND status = 'approved')
  WHERE id = prop_id;
$$ LANGUAGE SQL;

-- ─── HELPER FUNCTION: adjust saves (likes) count ──────────────────────────────
CREATE OR REPLACE FUNCTION adjust_property_saves(prop_id UUID, delta INT)
RETURNS void AS $$
  UPDATE properties SET saves_count = GREATEST(0, saves_count + delta) WHERE id = prop_id;
$$ LANGUAGE SQL;

-- ─── BED AVAILABILITY: keep property_rooms/properties counters in sync ───────
-- Derives total_beds/available_beds from real bed rows instead of relying on
-- whoever last wrote the counter — fires whenever a bed is added, removed, or
-- changes status (vacant/locked/occupied/notice-period).
CREATE OR REPLACE FUNCTION sync_bed_availability_counts() RETURNS TRIGGER AS $$
DECLARE
  r_id UUID := COALESCE(NEW.room_id, OLD.room_id);
  p_id UUID := COALESCE(NEW.property_id, OLD.property_id);
BEGIN
  UPDATE property_rooms SET
    total_beds = (SELECT COUNT(*) FROM beds WHERE room_id = r_id),
    available_beds = (SELECT COUNT(*) FROM beds WHERE room_id = r_id AND status = 'vacant')
  WHERE id = r_id;

  UPDATE properties SET
    total_beds = (SELECT COUNT(*) FROM beds WHERE property_id = p_id),
    available_beds = (SELECT COUNT(*) FROM beds WHERE property_id = p_id AND status = 'vacant')
  WHERE id = p_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_bed_availability ON beds;
CREATE TRIGGER trg_sync_bed_availability
AFTER INSERT OR UPDATE OF status OR DELETE ON beds
FOR EACH ROW EXECUTE FUNCTION sync_bed_availability_counts();

-- ─── BED LOCKING RPCS ──────────────────────────────────────────────────────
-- Atomically claim any vacant (or lock-expired) bed within a room-type bucket.
-- Used when an owner confirms a booking request. FOR UPDATE SKIP LOCKED is the
-- standard "claim one of many available resources" pattern — safe against the
-- race a plain SELECT-then-UPDATE would have under concurrent confirms.
CREATE OR REPLACE FUNCTION claim_bed_for_room(
  p_room_id UUID, p_locked_by UUID, p_booking_id UUID, p_ttl_minutes INT DEFAULT 2880
) RETURNS beds AS $$
DECLARE claimed beds;
BEGIN
  UPDATE beds SET
    status = 'locked', locked_by = p_locked_by, locked_at = now(),
    locked_until = now() + (p_ttl_minutes || ' minutes')::interval,
    current_booking_id = p_booking_id, updated_at = now()
  WHERE id = (
    SELECT id FROM beds
    WHERE room_id = p_room_id
      AND (status = 'vacant' OR (status = 'locked' AND locked_until < now()))
    ORDER BY status ASC, locked_until ASC NULLS FIRST, label ASC
    FOR UPDATE SKIP LOCKED LIMIT 1
  )
  RETURNING * INTO claimed;
  RETURN claimed; -- NULL if none available
END;
$$ LANGUAGE plpgsql;

-- Re-claim/extend a SPECIFIC already-assigned bed. Used at actual payment time
-- to protect the short Razorpay checkout window.
CREATE OR REPLACE FUNCTION reclaim_or_extend_bed(
  p_bed_id UUID, p_locked_by UUID, p_booking_id UUID, p_ttl_minutes INT DEFAULT 20
) RETURNS beds AS $$
DECLARE claimed beds;
BEGIN
  UPDATE beds SET
    status = 'locked', locked_by = p_locked_by, locked_at = now(),
    locked_until = now() + (p_ttl_minutes || ' minutes')::interval,
    current_booking_id = p_booking_id, updated_at = now()
  WHERE id = p_bed_id
    AND (status = 'vacant'
      OR (status = 'locked' AND (locked_until < now() OR locked_by = p_locked_by)))
  RETURNING * INTO claimed;
  RETURN claimed;
END;
$$ LANGUAGE plpgsql;

-- locked/vacant -> occupied. Idempotent on repeat calls for the same booking
-- (safe to retry from the payment-verify handler).
CREATE OR REPLACE FUNCTION occupy_bed(p_bed_id UUID, p_booking_id UUID) RETURNS beds AS $$
DECLARE occ beds;
BEGIN
  UPDATE beds SET
    status = 'occupied', locked_by = NULL, locked_at = NULL, locked_until = NULL,
    current_booking_id = p_booking_id, updated_at = now()
  WHERE id = p_bed_id
    AND (status IN ('locked', 'vacant') OR (status = 'occupied' AND current_booking_id = p_booking_id))
  RETURNING * INTO occ;
  RETURN occ;
END;
$$ LANGUAGE plpgsql;

-- locked -> vacant. Deliberately refuses to touch an 'occupied' bed — ending
-- an active tenancy belongs to the future vacate/notice-period flow.
CREATE OR REPLACE FUNCTION release_bed(p_bed_id UUID, p_booking_id UUID DEFAULT NULL) RETURNS beds AS $$
DECLARE released beds;
BEGIN
  UPDATE beds SET
    status = 'vacant', locked_by = NULL, locked_at = NULL, locked_until = NULL, current_booking_id = NULL, updated_at = now()
  WHERE id = p_bed_id AND status = 'locked'
    AND (p_booking_id IS NULL OR current_booking_id = p_booking_id)
  RETURNING * INTO released;
  RETURN released;
END;
$$ LANGUAGE plpgsql;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update own; backend (service key) bypasses RLS
CREATE POLICY "profiles_own_read" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- properties: public can read verified; owners can CRUD own
CREATE POLICY "properties_public_read" ON properties FOR SELECT USING (status = 'verified');
CREATE POLICY "properties_owner_all" ON properties FOR ALL USING (auth.uid() = owner_id);

-- property_rooms & images: public can read for verified properties (join handles this via RLS bypass from backend)
CREATE POLICY "rooms_read_all" ON property_rooms FOR SELECT USING (true);
CREATE POLICY "images_read_all" ON property_images FOR SELECT USING (true);

-- beds: public read (availability display); all writes via backend service role
CREATE POLICY "beds_read_all" ON beds FOR SELECT USING (true);

-- bookings: tenant or property owner can read
CREATE POLICY "bookings_tenant_read" ON bookings FOR SELECT USING (auth.uid() = tenant_id);

-- saved_properties: own only
CREATE POLICY "saved_own" ON saved_properties FOR ALL USING (auth.uid() = user_id);

-- payments/commissions: backend only via service role key
-- No user-facing policies; all access via service role

-- reviews: public can read approved; tenant can read/insert own
CREATE POLICY "reviews_public_read_approved" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "reviews_own_read" ON reviews FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "reviews_own_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- ─── AUTO-CONFIRM EMAILS FOR LOCAL DEV (optional) ───────────────────────────
-- In Supabase dashboard: Authentication > Settings > disable "Confirm email"
-- for faster local development.

-- ─── SCALE: indexes + atomic counters (mirrors migrations/004) ──────────────
-- ─── Search: `ilike '%term%'` can't use a btree index; trigram GIN can ────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_properties_name_trgm ON properties USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_city_trgm ON properties USING gin (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_state_trgm ON properties USING gin (state gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_address_trgm ON properties USING gin (address gin_trgm_ops);

-- ─── Public listing: always filtered by status, then sorted ──────────────────
CREATE INDEX IF NOT EXISTS idx_properties_status_created ON properties(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_status_price ON properties(status, starting_price);
CREATE INDEX IF NOT EXISTS idx_properties_status_rating ON properties(status, rating DESC);

-- ─── Foreign keys used by embedded selects (Postgres doesn't index FKs) ───────
CREATE INDEX IF NOT EXISTS idx_property_rooms_property ON property_rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_property_rooms_type ON property_rooms(type, property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id, position);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON inquiries(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_user ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property ON saved_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant ON reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_property ON commissions(property_id);
CREATE INDEX IF NOT EXISTS idx_commissions_created ON commissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON profiles(role, is_active);

-- ─── Atomic view counter (read-then-write loses increments under load) ───────
CREATE OR REPLACE FUNCTION increment_property_views(prop_id UUID)
RETURNS VOID AS $$
  UPDATE properties SET views = COALESCE(views, 0) + 1 WHERE id = prop_id;
$$ LANGUAGE sql;

-- ─── Payment totals computed in SQL instead of pulling every row to the Worker
CREATE OR REPLACE FUNCTION payment_totals()
RETURNS TABLE (
  platform_revenue NUMERIC,
  owner_payouts NUMERIC,
  referrer_commissions NUMERIC,
  agent_commissions NUMERIC
) AS $$
  SELECT
    COALESCE(SUM(platform_revenue), 0),
    COALESCE(SUM(owner_payout), 0),
    COALESCE(SUM(referrer_commission), 0),
    COALESCE(SUM(agent_commission), 0)
  FROM payments
  WHERE status = 'paid';
$$ LANGUAGE sql STABLE;

-- ─── LISTING FEE + OWNER KYC (mirrors migrations/005) ──────────────────────
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
