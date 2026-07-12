-- Backs auto-generated Asset.assetTag values (issue #13). A Postgres
-- sequence guarantees uniqueness under concurrent registrations without
-- a race condition, which a MAX(assetTag)+1 read-then-write in
-- application code would not.
CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START WITH 1;