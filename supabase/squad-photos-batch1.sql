-- =====================================================================
-- MTWAPA PREMIER LEAGUE — PLAYER PHOTOS
-- Run this ONCE, after schema.sql (and after admin-approval-system.sql
-- if you've run that one — either order works).
--
-- Adds a photo to each squad member, reusing the same squads table you
-- already manage in the admin panel — no separate "players" system to
-- keep in sync, just one more field per player.
-- =====================================================================

alter table squads add column photo_url text;

-- storage bucket for player photos (same pattern as the gallery bucket)
insert into storage.buckets (id, name, public)
  values ('players', 'players', true)
  on conflict (id) do nothing;

create policy "public read player photos"
  on storage.objects for select
  using (bucket_id = 'players');

create policy "approved upload player photos"
  on storage.objects for insert
  with check (bucket_id = 'players' and exists (select 1 from admins where user_id = auth.uid() and approved = true));

create policy "approved delete player photos"
  on storage.objects for delete
  using (bucket_id = 'players' and exists (select 1 from admins where user_id = auth.uid() and approved = true));
