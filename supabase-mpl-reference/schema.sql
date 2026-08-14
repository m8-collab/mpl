-- =====================================================================
-- MTWAPA PREMIER LEAGUE — SUPABASE SCHEMA
-- Run this ONCE in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste this whole file → Run)
-- =====================================================================

-- ---------- TABLES ----------

create table clubs (
  id    text primary key,
  name  text not null,
  venue text
);

create table table_rows (
  club_id text primary key references clubs(id) on delete cascade,
  p int not null default 0,
  w int not null default 0,
  d int not null default 0,
  l int not null default 0,
  gf int not null default 0,
  ga int not null default 0
);

create table scorers (
  id bigserial primary key,
  player_name text not null,
  club_id text references clubs(id) on delete set null,
  goals int not null default 0
);

create table fixtures (
  id text primary key,          -- e.g. 'm150'
  match_no text,
  date date not null,
  home_id text references clubs(id),
  away_id text references clubs(id),
  venue text,
  kickoff text
);

create table squads (
  id bigserial primary key,
  club_id text references clubs(id) on delete cascade,
  player_name text not null,
  jersey_no int
);

create table news (
  id bigserial primary key,
  tag text,
  title text not null,
  body text,
  created_at timestamptz default now()
);

create table gallery (
  id bigserial primary key,
  url text not null,
  caption text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table settings (
  id int primary key default 1,
  season_label text,
  as_of_label text,
  constraint single_row check (id = 1)
);
insert into settings (id, season_label, as_of_label)
  values (1, 'Season 2026 — 5th Edition', 'as at August 2026');

-- ---------- ROW LEVEL SECURITY ----------
-- Anyone (the public website, using the "anon" key) can READ everything.
-- Only a logged-in admin (authenticated user) can WRITE/EDIT/DELETE.

alter table clubs       enable row level security;
alter table table_rows  enable row level security;
alter table scorers     enable row level security;
alter table fixtures    enable row level security;
alter table squads      enable row level security;
alter table news        enable row level security;
alter table gallery     enable row level security;
alter table settings    enable row level security;

-- clubs
create policy "public read clubs"   on clubs for select using (true);
create policy "admin write clubs"   on clubs for insert with check (auth.role() = 'authenticated');
create policy "admin update clubs"  on clubs for update using (auth.role() = 'authenticated');
create policy "admin delete clubs"  on clubs for delete using (auth.role() = 'authenticated');

-- table_rows
create policy "public read table_rows"  on table_rows for select using (true);
create policy "admin write table_rows"  on table_rows for insert with check (auth.role() = 'authenticated');
create policy "admin update table_rows" on table_rows for update using (auth.role() = 'authenticated');
create policy "admin delete table_rows" on table_rows for delete using (auth.role() = 'authenticated');

-- scorers
create policy "public read scorers"  on scorers for select using (true);
create policy "admin write scorers"  on scorers for insert with check (auth.role() = 'authenticated');
create policy "admin update scorers" on scorers for update using (auth.role() = 'authenticated');
create policy "admin delete scorers" on scorers for delete using (auth.role() = 'authenticated');

-- fixtures
create policy "public read fixtures"  on fixtures for select using (true);
create policy "admin write fixtures"  on fixtures for insert with check (auth.role() = 'authenticated');
create policy "admin update fixtures" on fixtures for update using (auth.role() = 'authenticated');
create policy "admin delete fixtures" on fixtures for delete using (auth.role() = 'authenticated');

-- squads
create policy "public read squads"  on squads for select using (true);
create policy "admin write squads"  on squads for insert with check (auth.role() = 'authenticated');
create policy "admin update squads" on squads for update using (auth.role() = 'authenticated');
create policy "admin delete squads" on squads for delete using (auth.role() = 'authenticated');

-- news
create policy "public read news"  on news for select using (true);
create policy "admin write news"  on news for insert with check (auth.role() = 'authenticated');
create policy "admin update news" on news for update using (auth.role() = 'authenticated');
create policy "admin delete news" on news for delete using (auth.role() = 'authenticated');

-- gallery
create policy "public read gallery"  on gallery for select using (true);
create policy "admin write gallery"  on gallery for insert with check (auth.role() = 'authenticated');
create policy "admin update gallery" on gallery for update using (auth.role() = 'authenticated');
create policy "admin delete gallery" on gallery for delete using (auth.role() = 'authenticated');

-- settings
create policy "public read settings"  on settings for select using (true);
create policy "admin update settings" on settings for update using (auth.role() = 'authenticated');

-- ---------- REALTIME ----------
-- Let the public site receive instant updates when the admin changes data.
alter publication supabase_realtime add table clubs, table_rows, scorers, fixtures, squads, news, gallery, settings;

-- ---------- STORAGE (run this part too — creates the gallery photo bucket) ----------
insert into storage.buckets (id, name, public)
  values ('gallery', 'gallery', true)
  on conflict (id) do nothing;

create policy "public read gallery photos"
  on storage.objects for select
  using (bucket_id = 'gallery');

create policy "admin upload gallery photos"
  on storage.objects for insert
  with check (bucket_id = 'gallery' and auth.role() = 'authenticated');

create policy "admin delete gallery photos"
  on storage.objects for delete
  using (bucket_id = 'gallery' and auth.role() = 'authenticated');
