-- =====================================================================
-- POSTPONED MATCHES + PLAYER POSITION + FOUL REASON
-- Run this ONCE against the same Supabase project.
-- =====================================================================

-- ---------- postponed matches ----------
-- A postponed fixture keeps its original date/opponents but is flagged
-- so the site can show "Postponed" instead of treating it as either an
-- upcoming fixture or a result. It's automatically excluded from the
-- standings the same way an unplayed fixture already is (no score set),
-- this just makes the reason visible instead of looking like a fixture
-- nobody has reported on yet.
alter table fixtures
  add column if not exists postponed boolean not null default false,
  add column if not exists postponed_note text;

-- ---------- player position (replaces jersey number in the UI) ----------
alter table squads
  add column if not exists position text;

-- ---------- foul reason on cards (for match officials) ----------
alter table cards
  add column if not exists foul_reason text;
