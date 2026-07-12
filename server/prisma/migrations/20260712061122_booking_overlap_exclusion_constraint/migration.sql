-- Safety net for BR-012 (booking overlap rejected; back-to-back allowed).
-- Overlap validation is enforced in bookingService (issue #20); this
-- exclusion constraint guarantees it at the database level even if a
-- caller bypasses the service layer.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    "assetId" WITH =,
    tsrange("startTime", "endTime") WITH &&
  )
  WHERE (status = 'CONFIRMED');