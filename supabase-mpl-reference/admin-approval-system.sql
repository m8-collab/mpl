-- =====================================================================
-- MTWAPA PREMIER LEAGUE — ADMIN REGISTRATION & APPROVAL SYSTEM
-- Run this ONCE, AFTER schema.sql and seed_data.sql, in the SQL Editor.
--
-- What this adds:
--  - Self-service registration on admin.html (email + password)
--  - Password reset ("forgot password") via email
--  - An approval allowlist: registering creates a PENDING account that
--    can log in but can't change anything until an existing admin
--    approves them from the new "Admins" tab. Without this, literally
--    anyone who found the admin.html URL could register and get full
--    write access — this closes that gap.
--  - You (whoever already has a login from the original setup) are
--    automatically marked approved by this script, no action needed.
-- =====================================================================

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  approved boolean not null default false,
  created_at timestamptz default now()
);

alter table admins enable row level security;

-- Anyone can see their OWN row (so they know if they're still pending).
-- Approved admins can see every row (to review new signups).
create policy "read own or if approved" on admins for select
  using (
    user_id = auth.uid()
    or exists (select 1 from admins a2 where a2.user_id = auth.uid() and a2.approved = true)
  );

-- Only an approved admin can approve/edit or remove other admin rows.
create policy "approved admins manage admins" on admins for update
  using (exists (select 1 from admins a2 where a2.user_id = auth.uid() and a2.approved = true));

create policy "approved admins can remove admins" on admins for delete
  using (exists (select 1 from admins a2 where a2.user_id = auth.uid() and a2.approved = true));

-- Every new signup is automatically added here as PENDING (approved = false).
create function public.handle_new_admin_signup()
returns trigger as $$
begin
  insert into public.admins (user_id, email, approved) values (new.id, new.email, false);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_admin_signup();

-- Backfill: anyone who ALREADY has a login (from the original setup,
-- i.e. you) becomes auto-approved so you're not locked out.
insert into admins (user_id, email, approved)
  select id, email, true from auth.users
  on conflict (user_id) do update set approved = true;

-- =====================================================================
-- TIGHTEN WRITE ACCESS: replace "any logged-in user can write" with
-- "must be an APPROVED admin" on every content table + gallery storage.
-- =====================================================================

drop policy if exists "admin write clubs"   on clubs;
drop policy if exists "admin update clubs"  on clubs;
drop policy if exists "admin delete clubs"  on clubs;
create policy "approved write clubs"  on clubs for insert with check (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved update clubs" on clubs for update using (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved delete clubs" on clubs for delete using (exists (select 1 from admins where user_id = auth.uid() and approved = true));

drop policy if exists "admin write table_rows"   on table_rows;
drop policy if exists "admin update table_rows"  on table_rows;
drop policy if exists "admin delete table_rows"  on table_rows;
create policy "approved write table_rows"  on table_rows for insert with check (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved update table_rows" on table_rows for update using (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved delete table_rows" on table_rows for delete using (exists (select 1 from admins where user_id = auth.uid() and approved = true));

drop policy if exists "admin write scorers"   on scorers;
drop policy if exists "admin update scorers"  on scorers;
drop policy if exists "admin delete scorers"  on scorers;
create policy "approved write scorers"  on scorers for insert with check (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved update scorers" on scorers for update using (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved delete scorers" on scorers for delete using (exists (select 1 from admins where user_id = auth.uid() and approved = true));

drop policy if exists "admin write fixtures"   on fixtures;
drop policy if exists "admin update fixtures"  on fixtures;
drop policy if exists "admin delete fixtures"  on fixtures;
create policy "approved write fixtures"  on fixtures for insert with check (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved update fixtures" on fixtures for update using (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved delete fixtures" on fixtures for delete using (exists (select 1 from admins where user_id = auth.uid() and approved = true));

drop policy if exists "admin write squads"   on squads;
drop policy if exists "admin update squads"  on squads;
drop policy if exists "admin delete squads"  on squads;
create policy "approved write squads"  on squads for insert with check (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved update squads" on squads for update using (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved delete squads" on squads for delete using (exists (select 1 from admins where user_id = auth.uid() and approved = true));

drop policy if exists "admin write news"   on news;
drop policy if exists "admin update news"  on news;
drop policy if exists "admin delete news"  on news;
create policy "approved write news"  on news for insert with check (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved update news" on news for update using (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved delete news" on news for delete using (exists (select 1 from admins where user_id = auth.uid() and approved = true));

drop policy if exists "admin write gallery"   on gallery;
drop policy if exists "admin update gallery"  on gallery;
drop policy if exists "admin delete gallery"  on gallery;
create policy "approved write gallery"  on gallery for insert with check (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved update gallery" on gallery for update using (exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved delete gallery" on gallery for delete using (exists (select 1 from admins where user_id = auth.uid() and approved = true));

drop policy if exists "admin update settings" on settings;
create policy "approved update settings" on settings for update using (exists (select 1 from admins where user_id = auth.uid() and approved = true));

-- gallery photo storage (uploads/deletes)
drop policy if exists "admin upload gallery photos" on storage.objects;
drop policy if exists "admin delete gallery photos" on storage.objects;
create policy "approved upload gallery photos"
  on storage.objects for insert
  with check (bucket_id = 'gallery' and exists (select 1 from admins where user_id = auth.uid() and approved = true));
create policy "approved delete gallery photos"
  on storage.objects for delete
  using (bucket_id = 'gallery' and exists (select 1 from admins where user_id = auth.uid() and approved = true));
