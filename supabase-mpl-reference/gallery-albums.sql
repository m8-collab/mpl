-- =====================================================================
-- MTWAPA PREMIER LEAGUE — GALLERY ALBUMS
-- Run this ONCE, after schema.sql (and after admin-approval-system.sql
-- if you've already run that one — either order works).
--
-- Adds "albums" (folders/themes) so gallery photos can be grouped by
-- event/game instead of one long flat list — e.g. "Matchday: Mikanjuni
-- vs Bahari United", "Season Opener", "Awards Night".
-- =====================================================================

create table albums (
  id bigserial primary key,
  name text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table gallery add column album_id bigint references albums(id) on delete set null;

alter table albums enable row level security;

create policy "public read albums" on albums for select using (true);

-- Uses the approved-admin allowlist if you've run admin-approval-system.sql.
-- If you HAVEN'T run that migration yet, run it first — these policies
-- depend on the "admins" table it creates.
create policy "approved write albums"  on albums for insert with check (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved update albums" on albums for update using (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved delete albums" on albums for delete using (exists (select 1 from admins where user_id = auth.uid() and approved = true));

alter publication supabase_realtime add table albums;

-- Starter album, and move any existing uncategorized photos into it
-- so nothing on the live site disappears.
insert into albums (name, description) values ('Matchday Photos', 'General matchday photos.');
update gallery set album_id = (select id from albums where name = 'Matchday Photos')
  where album_id is null;
