-- =====================================================================
-- FIX: infinite recursion in admin approval policies
-- Run this ONCE, after admin-approval-system.sql.
--
-- The problem: policies that check "is this user an approved admin?"
-- did so by querying the admins table directly inside the policy —
-- but querying admins ALSO triggers admins' own policies, which query
-- admins again, forever, until Postgres errors out (HTTP 500).
--
-- The fix: a small helper function that checks approval status while
-- bypassing RLS (SECURITY DEFINER), so the check doesn't re-trigger
-- itself. Every policy that used to inline that check now calls this
-- function instead.
-- =====================================================================

create or replace function public.is_approved_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins where user_id = auth.uid() and approved = true
  );
$$;

-- ---------- admins table's own policies (this is where the recursion was) ----------
drop policy if exists "read own or if approved" on admins;
drop policy if exists "approved admins manage admins" on admins;
drop policy if exists "approved admins can remove admins" on admins;

create policy "read own or if approved" on admins for select
  using (user_id = auth.uid() or public.is_approved_admin());

create policy "approved admins manage admins" on admins for update
  using (public.is_approved_admin());

create policy "approved admins can remove admins" on admins for delete
  using (public.is_approved_admin());

-- ---------- every content table: swap the inline subquery for the function ----------
drop policy if exists "approved write clubs"  on clubs;
drop policy if exists "approved update clubs" on clubs;
drop policy if exists "approved delete clubs" on clubs;
create policy "approved write clubs"  on clubs for insert with check (public.is_approved_admin());
create policy "approved update clubs" on clubs for update using (public.is_approved_admin());
create policy "approved delete clubs" on clubs for delete using (public.is_approved_admin());

drop policy if exists "approved write table_rows"  on table_rows;
drop policy if exists "approved update table_rows" on table_rows;
drop policy if exists "approved delete table_rows" on table_rows;
create policy "approved write table_rows"  on table_rows for insert with check (public.is_approved_admin());
create policy "approved update table_rows" on table_rows for update using (public.is_approved_admin());
create policy "approved delete table_rows" on table_rows for delete using (public.is_approved_admin());

drop policy if exists "approved write scorers"  on scorers;
drop policy if exists "approved update scorers" on scorers;
drop policy if exists "approved delete scorers" on scorers;
create policy "approved write scorers"  on scorers for insert with check (public.is_approved_admin());
create policy "approved update scorers" on scorers for update using (public.is_approved_admin());
create policy "approved delete scorers" on scorers for delete using (public.is_approved_admin());

drop policy if exists "approved write fixtures"  on fixtures;
drop policy if exists "approved update fixtures" on fixtures;
drop policy if exists "approved delete fixtures" on fixtures;
create policy "approved write fixtures"  on fixtures for insert with check (public.is_approved_admin());
create policy "approved update fixtures" on fixtures for update using (public.is_approved_admin());
create policy "approved delete fixtures" on fixtures for delete using (public.is_approved_admin());

drop policy if exists "approved write squads"  on squads;
drop policy if exists "approved update squads" on squads;
drop policy if exists "approved delete squads" on squads;
create policy "approved write squads"  on squads for insert with check (public.is_approved_admin());
create policy "approved update squads" on squads for update using (public.is_approved_admin());
create policy "approved delete squads" on squads for delete using (public.is_approved_admin());

drop policy if exists "approved write news"  on news;
drop policy if exists "approved update news" on news;
drop policy if exists "approved delete news" on news;
create policy "approved write news"  on news for insert with check (public.is_approved_admin());
create policy "approved update news" on news for update using (public.is_approved_admin());
create policy "approved delete news" on news for delete using (public.is_approved_admin());

drop policy if exists "approved write gallery"  on gallery;
drop policy if exists "approved update gallery" on gallery;
drop policy if exists "approved delete gallery" on gallery;
create policy "approved write gallery"  on gallery for insert with check (public.is_approved_admin());
create policy "approved update gallery" on gallery for update using (public.is_approved_admin());
create policy "approved delete gallery" on gallery for delete using (public.is_approved_admin());

drop policy if exists "approved update settings" on settings;
create policy "approved update settings" on settings for update using (public.is_approved_admin());

-- albums (only present if you already ran gallery-albums.sql — skipped safely if not)
do $$
begin
  if to_regclass('public.albums') is not null then
    execute 'drop policy if exists "approved write albums"  on albums';
    execute 'drop policy if exists "approved update albums" on albums';
    execute 'drop policy if exists "approved delete albums" on albums';
    execute 'create policy "approved write albums"  on albums for insert with check (public.is_approved_admin())';
    execute 'create policy "approved update albums" on albums for update using (public.is_approved_admin())';
    execute 'create policy "approved delete albums" on albums for delete using (public.is_approved_admin())';
  end if;
end $$;

-- gallery photo storage
drop policy if exists "approved upload gallery photos" on storage.objects;
drop policy if exists "approved delete gallery photos" on storage.objects;
create policy "approved upload gallery photos"
  on storage.objects for insert
  with check (bucket_id = 'gallery' and public.is_approved_admin());
create policy "approved delete gallery photos"
  on storage.objects for delete
  using (bucket_id = 'gallery' and public.is_approved_admin());
