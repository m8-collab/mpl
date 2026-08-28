-- =====================================================================
-- SAFE AUTO-UPDATING TABLE (incremental, not a full recompute)
--
-- Earlier in this project, an auto-recalculate trigger was tried and
-- then turned off — it worked by deleting every table_rows entry and
-- rebuilding the whole table from scratch by summing every fixture's
-- score. That wiped out real standings, because most historical
-- matches were never entered with individual scores (only the
-- season-long P/W/D/L/GF/GA totals were ever tracked directly).
--
-- This version is different and safe to turn on now: it does NOT
-- recompute from scratch. It only applies the DELTA for the one
-- fixture that was just inserted, updated, or deleted — leaving every
-- other club's row, and whatever manually-entered baseline is already
-- there, completely untouched. Whatever your table shows right now
-- becomes the correct starting point; only new results (or edits to a
-- specific fixture's score) change anything from here on.
--
-- Run this ONCE. It's safe to run even with real data already in
-- table_rows and fixtures.
-- =====================================================================

create or replace function public.apply_fixture_result_delta(
  p_club_id text, p_gf int, p_ga int, p_sign int
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_club_id is null then return; end if;
  insert into table_rows (club_id, p, w, d, l, gf, ga)
  values (
    p_club_id,
    p_sign,
    case when p_gf > p_ga then p_sign else 0 end,
    case when p_gf = p_ga then p_sign else 0 end,
    case when p_gf < p_ga then p_sign else 0 end,
    p_gf * p_sign,
    p_ga * p_sign
  )
  on conflict (club_id) do update set
    p  = table_rows.p  + excluded.p,
    w  = table_rows.w  + excluded.w,
    d  = table_rows.d  + excluded.d,
    l  = table_rows.l  + excluded.l,
    gf = table_rows.gf + excluded.gf,
    ga = table_rows.ga + excluded.ga;
end;
$$;

create or replace function public.fixtures_apply_result_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_counts boolean;
  new_counts boolean;
  pairing_changed boolean;
  scoreline_changed boolean;
begin
  old_counts := (TG_OP <> 'INSERT') and OLD.home_score is not null and OLD.away_score is not null and not OLD.postponed;
  new_counts := (TG_OP <> 'DELETE') and NEW.home_score is not null and NEW.away_score is not null and not NEW.postponed;

  pairing_changed := TG_OP = 'UPDATE' and (OLD.home_id is distinct from NEW.home_id or OLD.away_id is distinct from NEW.away_id);
  scoreline_changed := TG_OP = 'UPDATE' and (OLD.home_score is distinct from NEW.home_score or OLD.away_score is distinct from NEW.away_score);

  -- Remove the OLD contribution if it used to count, and either no
  -- longer does, or the fixture/scoreline/pairing actually changed.
  if old_counts and (TG_OP in ('DELETE','UPDATE')) and (TG_OP = 'DELETE' or not new_counts or pairing_changed or scoreline_changed) then
    perform public.apply_fixture_result_delta(OLD.home_id, OLD.home_score, OLD.away_score, -1);
    perform public.apply_fixture_result_delta(OLD.away_id, OLD.away_score, OLD.home_score, -1);
  end if;

  -- Apply the NEW contribution if it counts now, and either it's a
  -- fresh insert, it didn't count before, or something about it changed.
  if new_counts and (TG_OP = 'INSERT' or not old_counts or pairing_changed or scoreline_changed) then
    perform public.apply_fixture_result_delta(NEW.home_id, NEW.home_score, NEW.away_score, 1);
    perform public.apply_fixture_result_delta(NEW.away_id, NEW.away_score, NEW.home_score, 1);
  end if;

  return coalesce(NEW, OLD);
end;
$$;

-- Replace any earlier full-recompute trigger with this row-level,
-- delta-based one.
drop trigger if exists fixtures_recalc_table on fixtures;
drop trigger if exists fixtures_apply_result_change on fixtures;
create trigger fixtures_apply_result_change
  after insert or update or delete on fixtures
  for each row execute function public.fixtures_apply_result_change();
