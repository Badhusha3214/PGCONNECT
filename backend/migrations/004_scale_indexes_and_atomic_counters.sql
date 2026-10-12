-- Migration 004 — indexes for the hot query paths + atomic counters.
-- Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE everywhere).

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
