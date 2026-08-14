-- =====================================================================
-- FIX ASSET PATHS FOR THE REACT APP
--
-- The static MPL site used a hash-router (#/clubs/x), so root-relative
-- paths like "assets/players/ama4/000.jpg" always resolved correctly no
-- matter what page you were on. The new React app uses real routes
-- (e.g. /clubs/ama4), so the SAME path without a leading slash would
-- resolve as /clubs/assets/players/ama4/000.jpg and 404.
--
-- This script:
--   1. Adds a leading "/" to any existing squads.photo_url that doesn't
--      already have one, so player headshots keep working.
--   2. Populates clubs.crest_url (currently unused — crests lived only
--      in a client-side JS lookup table on the old static site) so the
--      React app's ClubBadge component, which already reads
--      club.crest_url, starts showing real crests instead of the
--      colored-initials fallback.
--
-- Run this once against the same Supabase project, after deploying the
-- image files under public/assets/crests/ and public/assets/players/
-- (bundled in the merged app's repo).
-- =====================================================================

update squads
set photo_url = '/' || photo_url
where photo_url is not null
  and photo_url not like '/%';

update clubs set crest_url = '/assets/crests/' || id || '.jpg'
where id in (
  'travellers','revolution','laliga','newtalent','mgandini','mpatempate',
  'mtwapaallstars','kilifiteachers','mikanjuni','bahariutd','fuhua','baraza',
  'kicks','mtepeni','dola','progressive','ambassadors','kanamai','mega','ama4',
  'sunset','kimbunga','posterrangers','youngheroes','mvitaoil','mtwapaseniors',
  'majaoni','fullsun','zion','komboa','bomaniyouth'
);
