-- Migration 006 — allow rooms with more than 3 beds ("4 Sharing", "5+ Sharing").
-- Safe to re-run. Keep in sync with ROOM_TYPES in backend/src/routes/properties.ts
-- and client/src/lib/listing.js.

-- Drop the old Single/Double/Triple checks whatever Postgres named them.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname, conrelid::regclass AS tbl
    FROM pg_constraint
    WHERE contype = 'c'
      AND conrelid IN ('property_rooms'::regclass, 'bookings'::regclass)
      AND pg_get_constraintdef(oid) ILIKE '%''Triple''%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.tbl, c.conname);
  END LOOP;
END $$;

ALTER TABLE property_rooms ADD CONSTRAINT property_rooms_type_check
  CHECK (type IN ('Single', 'Double', 'Triple', '4 Sharing', '5+ Sharing'));

ALTER TABLE bookings ADD CONSTRAINT bookings_room_type_check
  CHECK (room_type IN ('Single', 'Double', 'Triple', '4 Sharing', '5+ Sharing'));
