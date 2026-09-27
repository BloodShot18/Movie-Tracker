-- Run this once against your existing database:
--   wrangler d1 execute watch-log-db --remote --file=./migration_001_rooms_genres.sql
-- (use --local instead of --remote for local dev)

ALTER TABLE entries ADD COLUMN genre TEXT NOT NULL DEFAULT 'Other';
ALTER TABLE entries ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE entries ADD COLUMN room_code TEXT;

-- Fixes the full-table-scan issue: the old index was (day, created_at),
-- but the 7-day feed query filters on created_at alone.
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries (created_at DESC);

-- Supports the public-feed and private-room-feed queries efficiently.
CREATE INDEX IF NOT EXISTS idx_entries_visibility_created ON entries (visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_room_created ON entries (room_code, created_at DESC);

-- Supports genre filtering and the watched-count lookup.
CREATE INDEX IF NOT EXISTS idx_entries_genre ON entries (genre);
CREATE INDEX IF NOT EXISTS idx_entries_title_lower ON entries (lower(title));
