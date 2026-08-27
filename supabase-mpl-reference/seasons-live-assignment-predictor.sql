-- =====================================================================
-- SEASONS, LIVE MATCHES, OFFICIAL ASSIGNMENT, PREDICTOR LEADERBOARD
-- Run this ONCE against the same Supabase project.
-- =====================================================================

-- ---------- multi-season tagging ----------
-- Applies to fixtures and scorers, which can naturally hold many rows
-- per club across many seasons. table_rows is NOT included here — it's
-- keyed by club_id alone (one live standings row per club), so it can't
-- hold multiple seasons' worth of history without a much riskier
-- primary-key change. The league table stays "current season only";
-- fixtures and scorers become genuinely browsable by season.
alter table fixtures add column if not exists season text;
alter table scorers  add column if not exists season text;

-- One-time backfill: tag all existing rows with whatever the season
-- label currently is, so nothing already on the site becomes
-- "seasonless" the moment this runs.
update fixtures set season = coalesce((select season_label from settings where id = 1), 'Season 2026')
where season is null;
update scorers set season = coalesce((select season_label from settings where id = 1), 'Season 2026')
where season is null;

-- ---------- live match center ----------
-- Separate from `postponed` (already added earlier) — a match official
-- flips this on at kickoff and off at full time.
alter table fixtures add column if not exists live boolean not null default false;

-- ---------- referee/official assignment ----------
alter table fixtures add column if not exists assigned_official_id uuid references auth.users(id) on delete set null;

-- ---------- predictor leaderboard ----------
-- Anonymous (no login) — identified by name + phone, matching how the
-- rest of this site treats match officials/fans. One prediction per
-- fixture per phone number, enforced by the unique constraint below.
create table if not exists predictions (
  id bigserial primary key,
  fixture_id text references fixtures(id) on delete cascade,
  name text not null,
  phone text not null,
  pick text not null check (pick in ('home','draw','away')),
  created_at timestamptz not null default now(),
  unique (fixture_id, phone)
);

alter table predictions enable row level security;

grant select, insert on predictions to anon, authenticated;
grant usage, select on sequence predictions_id_seq to anon, authenticated;

create policy "anyone can read predictions" on predictions for select using (true);
create policy "anyone can submit a prediction" on predictions for insert with check (true);
-- No update/delete policy for anon on purpose — predictions are locked
-- in once submitted, same as a real bet slip.
