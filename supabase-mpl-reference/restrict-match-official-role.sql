-- =====================================================================
-- MATCH OFFICIAL ROLE — restrict a new account type to match reports only
--
-- Run this ONCE, after handwritten-rules-update.sql.
--
-- Adds a `role` column to `admins` ('admin' | 'match_official'), and a
-- new is_full_admin() check that only 'admin' rows pass. Every table that
-- should stay full-admin-only (clubs, table_rows, scorers, squads, news,
-- gallery, albums, settings, admins, sponsors) is re-pointed at
-- is_full_admin() instead of the old is_approved_admin(). Fixtures and
-- cards are left on is_approved_admin() (either role passes) — but
-- fixtures INSERT/DELETE is now full-admin-only too, so match officials
-- can fill in a report on an existing fixture but can't create, delete,
-- or reschedule one.
-- =====================================================================

alter table admins
  add column if not exists role text not null default 'admin'
  check (role in ('admin', 'match_official'));

create or replace function public.is_full_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins where user_id = auth.uid() and approved = true and role = 'admin'
  );
$$;

-- ---------- signup: read the role passed at registration time ----------
-- /admin registrations don't pass any metadata, so they default to 'admin'
-- (unchanged behaviour). /officials registrations pass
-- { data: { role: 'match_official' } } to supabase.auth.signUp(), which
-- lands in auth.users.raw_user_meta_data — this reads it back out.
create or replace function public.handle_new_admin_signup()
returns trigger as $$
begin
  insert into public.admins (user_id, email, approved, role)
  values (
    new.id,
    new.email,
    false,
    coalesce(new.raw_user_meta_data->>'role', 'admin')
  );
  return new;
end;
$$ language plpgsql security definer;

-- ---------- full-admin-only tables ----------
drop policy if exists "approved write clubs"  on clubs;
drop policy if exists "approved update clubs" on clubs;
drop policy if exists "approved delete clubs" on clubs;
create policy "full admin write clubs"  on clubs for insert with check (public.is_full_admin());
create policy "full admin update clubs" on clubs for update using (public.is_full_admin());
create policy "full admin delete clubs" on clubs for delete using (public.is_full_admin());

drop policy if exists "approved write table_rows"  on table_rows;
drop policy if exists "approved update table_rows" on table_rows;
drop policy if exists "approved delete table_rows" on table_rows;
create policy "full admin write table_rows"  on table_rows for insert with check (public.is_full_admin());
create policy "full admin update table_rows" on table_rows for update using (public.is_full_admin());
create policy "full admin delete table_rows" on table_rows for delete using (public.is_full_admin());

drop policy if exists "approved write scorers"  on scorers;
drop policy if exists "approved update scorers" on scorers;
drop policy if exists "approved delete scorers" on scorers;
create policy "full admin write scorers"  on scorers for insert with check (public.is_full_admin());
create policy "full admin update scorers" on scorers for update using (public.is_full_admin());
create policy "full admin delete scorers" on scorers for delete using (public.is_full_admin());

drop policy if exists "approved write squads"  on squads;
drop policy if exists "approved update squads" on squads;
drop policy if exists "approved delete squads" on squads;
create policy "full admin write squads"  on squads for insert with check (public.is_full_admin());
create policy "full admin update squads" on squads for update using (public.is_full_admin());
create policy "full admin delete squads" on squads for delete using (public.is_full_admin());

drop policy if exists "approved write news"  on news;
drop policy if exists "approved update news" on news;
drop policy if exists "approved delete news" on news;
create policy "full admin write news"  on news for insert with check (public.is_full_admin());
create policy "full admin update news" on news for update using (public.is_full_admin());
create policy "full admin delete news" on news for delete using (public.is_full_admin());

drop policy if exists "approved write gallery"  on gallery;
drop policy if exists "approved update gallery" on gallery;
drop policy if exists "approved delete gallery" on gallery;
create policy "full admin write gallery"  on gallery for insert with check (public.is_full_admin());
create policy "full admin update gallery" on gallery for update using (public.is_full_admin());
create policy "full admin delete gallery" on gallery for delete using (public.is_full_admin());

drop policy if exists "approved update settings" on settings;
create policy "full admin update settings" on settings for update using (public.is_full_admin());

drop policy if exists "approved write albums"  on albums;
drop policy if exists "approved update albums" on albums;
drop policy if exists "approved delete albums" on albums;
create policy "full admin write albums"  on albums for insert with check (public.is_full_admin());
create policy "full admin update albums" on albums for update using (public.is_full_admin());
create policy "full admin delete albums" on albums for delete using (public.is_full_admin());

drop policy if exists "admins manage sponsors" on sponsors;
create policy "full admin manage sponsors" on sponsors for all to authenticated
  using (public.is_full_admin()) with check (public.is_full_admin());

-- admins table itself: only full admins approve/revoke/delete other admins
drop policy if exists "approved admins manage admins" on admins;
create policy "full admins manage admins" on admins for all to authenticated
  using (public.is_full_admin()) with check (public.is_full_admin());

-- gallery storage bucket: uploads/deletes stay full-admin-only
drop policy if exists "approved upload gallery photos" on storage.objects;
drop policy if exists "approved delete gallery photos" on storage.objects;
create policy "approved upload gallery photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and public.is_full_admin());
create policy "approved delete gallery photos" on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and public.is_full_admin());

-- ---------- fixtures: match officials can UPDATE only, not create/delete ----------
drop policy if exists "approved write fixtures"  on fixtures;
drop policy if exists "approved delete fixtures" on fixtures;
create policy "full admin write fixtures"  on fixtures for insert with check (public.is_full_admin());
create policy "full admin delete fixtures" on fixtures for delete using (public.is_full_admin());
-- "approved update fixtures" (either role) is left as-is from fix-admin-rls-recursion.sql.

-- cards: either role can manage — filing cards is part of a match report
-- ("admins manage cards" from handwritten-rules-update.sql already uses
-- is_approved_admin(), which both roles satisfy, so no change needed there).
