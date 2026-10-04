-- =====================================================================
-- CLUB ACTIVE/DISCONTINUED STATUS
-- Run this ONCE against the same Supabase project.
-- =====================================================================

-- A discontinued club's history (past fixtures, scorers, cards, squad)
-- is left completely untouched — this only controls whether the club
-- shows up as a CURRENTLY competing club (standings, the main Clubs
-- directory, new-fixture scheduling). Their old matches, their profile
-- page, and any links to it from history keep working.
alter table clubs add column if not exists active boolean not null default true;

update clubs set active = false where id = 'kanamai';
