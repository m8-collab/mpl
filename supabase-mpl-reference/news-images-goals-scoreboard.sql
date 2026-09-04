-- =====================================================================
-- NEWS IMAGES + AUTO-UPDATING SCOREBOARD FROM MATCH GOALS
-- Run this ONCE against the same Supabase project.
-- =====================================================================

-- ---------- news post images ----------
alter table news add column if not exists image_url text;

-- ---------- per-match goals, driving the scoreboard automatically ----------
-- Same safe, incremental pattern as safe-auto-table-update.sql: a new
-- goal ADDS to that player's scorers.goals, a removed/edited goal
-- subtracts — nothing is ever wiped and recomputed from scratch, so
-- existing scorer totals are never at risk.
create table if not exists goals (
  id bigserial primary key,
  fixture_id text references fixtures(id) on delete cascade,
  club_id text references clubs(id) on delete cascade,
  player_name text not null,
  minute int,
  created_at timestamptz not null default now()
);

alter table goals enable row level security;
grant select on goals to anon, authenticated;
grant insert, update, delete on goals to authenticated;
grant usage, select on sequence goals_id_seq to authenticated;

create policy "public read goals" on goals for select using (true);
create policy "approved write goals" on goals for all to authenticated
  using (public.is_approved_admin()) with check (public.is_approved_admin());

create or replace function public.apply_goal_delta(p_club_id text, p_player_name text, p_sign int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id bigint;
begin
  if p_club_id is null or p_player_name is null then return; end if;
  select id into existing_id from scorers where club_id = p_club_id and player_name = p_player_name limit 1;
  if existing_id is not null then
    update scorers set goals = greatest(0, goals + p_sign) where id = existing_id;
  elsif p_sign > 0 then
    insert into scorers (player_name, club_id, goals) values (p_player_name, p_club_id, p_sign);
  end if;
end;
$$;

create or replace function public.goals_apply_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    perform public.apply_goal_delta(OLD.club_id, OLD.player_name, -1);
    return OLD;
  elsif TG_OP = 'INSERT' then
    perform public.apply_goal_delta(NEW.club_id, NEW.player_name, 1);
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if OLD.club_id is distinct from NEW.club_id or OLD.player_name is distinct from NEW.player_name then
      perform public.apply_goal_delta(OLD.club_id, OLD.player_name, -1);
      perform public.apply_goal_delta(NEW.club_id, NEW.player_name, 1);
    end if;
    return NEW;
  end if;
  return null;
end;
$$;

drop trigger if exists goals_apply_change on goals;
create trigger goals_apply_change
  after insert or update or delete on goals
  for each row execute function public.goals_apply_change();
