-- =====================================================================
-- APPEARANCES (real lineup tracking), MATCH PHOTOS, CONFIGURABLE
-- DISCIPLINE RULES, AND CONTACT INQUIRIES
-- Run this ONCE against the same Supabase project.
-- =====================================================================

-- ---------- appearances: who actually played, replacing free-text lineups ----------
-- home_lineup/away_lineup (free text on fixtures) are left in place and
-- unused rather than dropped — no data loss, and nothing currently reads
-- them stops working. This table is what powers real suspension
-- tracking: a ban is "served" by a fixture where the player has NO
-- appearance row (or one with started=false and no sub-on), not just by
-- time passing.
create table if not exists appearances (
  id bigserial primary key,
  fixture_id text references fixtures(id) on delete cascade,
  club_id text references clubs(id) on delete cascade,
  player_name text not null,
  started boolean not null default false,
  subbed_on_minute int,
  subbed_off_minute int,
  created_at timestamptz not null default now(),
  unique (fixture_id, club_id, player_name)
);

alter table appearances enable row level security;
grant select on appearances to anon, authenticated;
grant insert, update, delete on appearances to authenticated;
grant usage, select on sequence appearances_id_seq to authenticated;

create policy "public read appearances" on appearances for select using (true);
create policy "approved write appearances" on appearances for all to authenticated
  using (public.is_approved_admin()) with check (public.is_approved_admin());

-- ---------- matchday photo albums linked to a specific fixture ----------
-- The match official's dashboard already auto-creates/looks up an album
-- per fixture when uploading matchday photos (gallery.album_id already
-- points at albums) — this column is what makes that per-fixture lookup
-- actually work; without it the upload code has nothing to query.
alter table albums add column if not exists fixture_id text references fixtures(id) on delete set null;

-- ---------- admin-configurable discipline rules ----------
-- Same numbers that were previously hardcoded in the app
-- (5 yellows = 1-match ban, any red = 3-match ban) — now editable from
-- Settings instead of requiring a code change.
alter table settings add column if not exists yellow_threshold int not null default 5;
alter table settings add column if not exists yellow_ban_matches int not null default 1;
alter table settings add column if not exists red_ban_matches int not null default 3;

-- ---------- contact / inquiry form ----------
create table if not exists inquiries (
  id bigserial primary key,
  name text not null,
  phone text not null,
  club_id text references clubs(id) on delete set null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table inquiries enable row level security;
grant insert on inquiries to anon, authenticated;
grant select, update on inquiries to authenticated;
grant usage, select on sequence inquiries_id_seq to anon, authenticated;

create policy "anyone can submit an inquiry" on inquiries for insert with check (true);
create policy "full admins read inquiries" on inquiries for select to authenticated
  using (public.is_full_admin());
create policy "full admins update inquiries" on inquiries for update to authenticated
  using (public.is_full_admin());
-- No public select policy on purpose — inquiries contain contact details
-- and should only be readable by full admins, not published anywhere.
