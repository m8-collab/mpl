-- =====================================================================
-- MTWAPA PREMIER LEAGUE — STANDINGS & SCORERS REFRESH (as at 17 Aug 2026)
-- Run this ONCE in the SQL Editor. Supersedes update-standings-aug2026.sql
-- with the latest published Table Standing + Top Goal Scorers graphics.
-- Safe to re-run later with a fresh sheet the same way.
--
-- NB: run supabase-mpl-reference/handwritten-rules-update.sql FIRST if you
-- haven't already — it adds the table_rows.pts_adjustment column this
-- script uses for Mikanjuni FC (their sheet shows 7 pts, which is 2 less
-- than the standard 3×W+D=9 from their record — likely a disciplinary
-- deduction, so it's applied as an adjustment rather than faked into W/D).
-- =====================================================================

-- ---------- LEAGUE TABLE (31 clubs, "table as at: 17th August 2026") ----------
UPDATE table_rows SET p=11, w=10, d=1, l=0, gf=24, ga=2,  pts_adjustment=0 WHERE club_id='travellers';
UPDATE table_rows SET p=11, w=8,  d=1, l=2, gf=27, ga=9,  pts_adjustment=0 WHERE club_id='laliga';
UPDATE table_rows SET p=12, w=7,  d=1, l=4, gf=25, ga=12, pts_adjustment=0 WHERE club_id='bahariutd';
UPDATE table_rows SET p=11, w=6,  d=3, l=2, gf=12, ga=6,  pts_adjustment=0 WHERE club_id='fuhua';
UPDATE table_rows SET p=10, w=6,  d=3, l=1, gf=11, ga=5,  pts_adjustment=0 WHERE club_id='mgandini';
UPDATE table_rows SET p=10, w=6,  d=1, l=3, gf=18, ga=8,  pts_adjustment=0 WHERE club_id='mvitaoil';
UPDATE table_rows SET p=9,  w=5,  d=3, l=1, gf=14, ga=7,  pts_adjustment=0 WHERE club_id='mtwapaseniors';
UPDATE table_rows SET p=11, w=5,  d=3, l=3, gf=16, ga=12, pts_adjustment=0 WHERE club_id='bomaniyouth';
UPDATE table_rows SET p=10, w=5,  d=2, l=3, gf=20, ga=8,  pts_adjustment=0 WHERE club_id='kicks';
UPDATE table_rows SET p=10, w=4,  d=5, l=1, gf=16, ga=10, pts_adjustment=0 WHERE club_id='kimbunga';
UPDATE table_rows SET p=10, w=5,  d=2, l=3, gf=17, ga=15, pts_adjustment=0 WHERE club_id='revolution';
UPDATE table_rows SET p=9,  w=4,  d=3, l=2, gf=16, ga=11, pts_adjustment=0 WHERE club_id='fullsun';
UPDATE table_rows SET p=9,  w=4,  d=3, l=2, gf=17, ga=13, pts_adjustment=0 WHERE club_id='kanamai';
UPDATE table_rows SET p=10, w=4,  d=3, l=3, gf=10, ga=8,  pts_adjustment=0 WHERE club_id='mpatempate';
UPDATE table_rows SET p=11, w=3,  d=5, l=3, gf=14, ga=9,  pts_adjustment=0 WHERE club_id='progressive';
UPDATE table_rows SET p=11, w=4,  d=2, l=5, gf=16, ga=13, pts_adjustment=0 WHERE club_id='zion';
UPDATE table_rows SET p=10, w=3,  d=3, l=4, gf=11, ga=14, pts_adjustment=0 WHERE club_id='youngheroes';
UPDATE table_rows SET p=10, w=3,  d=3, l=4, gf=10, ga=13, pts_adjustment=0 WHERE club_id='majaoni';
UPDATE table_rows SET p=11, w=3,  d=3, l=5, gf=10, ga=17, pts_adjustment=0 WHERE club_id='sunset';
UPDATE table_rows SET p=11, w=4,  d=0, l=7, gf=14, ga=23, pts_adjustment=0 WHERE club_id='posterrangers';
UPDATE table_rows SET p=9,  w=3,  d=2, l=4, gf=10, ga=12, pts_adjustment=0 WHERE club_id='ama4';
UPDATE table_rows SET p=9,  w=3,  d=2, l=4, gf=13, ga=16, pts_adjustment=0 WHERE club_id='kilifiteachers';
UPDATE table_rows SET p=12, w=2,  d=4, l=6, gf=10, ga=18, pts_adjustment=0 WHERE club_id='komboa';
UPDATE table_rows SET p=10, w=1,  d=6, l=3, gf=13, ga=17, pts_adjustment=0 WHERE club_id='mtepeni';
UPDATE table_rows SET p=9,  w=2,  d=3, l=4, gf=13, ga=19, pts_adjustment=0 WHERE club_id='dola';
UPDATE table_rows SET p=9,  w=3,  d=0, l=6, gf=11, ga=19, pts_adjustment=0 WHERE club_id='newtalent';
UPDATE table_rows SET p=11, w=3,  d=0, l=8, gf=15, ga=25, pts_adjustment=-2 WHERE club_id='mikanjuni';
UPDATE table_rows SET p=10, w=2,  d=1, l=7, gf=6,  ga=25, pts_adjustment=0 WHERE club_id='mega';
UPDATE table_rows SET p=10, w=1,  d=3, l=6, gf=8,  ga=18, pts_adjustment=0 WHERE club_id='ambassadors';
UPDATE table_rows SET p=10, w=1,  d=2, l=7, gf=11, ga=23, pts_adjustment=0 WHERE club_id='mtwapaallstars';
UPDATE table_rows SET p=10, w=1,  d=2, l=7, gf=6,  ga=27, pts_adjustment=0 WHERE club_id='baraza';

-- ---------- TOP SCORERS (39 players — full replace) ----------
DELETE FROM scorers;

INSERT INTO scorers (player_name, club_id, goals) VALUES
  ('Ibra Nyanje', 'laliga', 9),
  ('Phidel Onyango', 'mvitaoil', 8),
  ('Walter Ichela', 'mtwapaseniors', 7),
  ('Jackson Kabaka', 'bahariutd', 7),
  ('Shebani Mwagandi', 'laliga', 7),
  ('Bernard Deche', 'kanamai', 6),
  ('Athman Mahadhi', 'progressive', 6),
  ('Maxwell Muye', 'zion', 6),
  ('Remi Kenga', 'travellers', 5),
  ('Steven David', 'revolution', 5),
  ('Quinton Kambu', 'revolution', 5),
  ('Lucky Rajab', 'mikanjuni', 5),
  ('Omari Abdalla', 'kicks', 5),
  ('Allan Leba', 'kimbunga', 5),
  ('Austerious Wafula', 'fuhua', 4),
  ('Amani Chengo', 'laliga', 4),
  ('Victor Chege', 'mega', 4),
  ('Baraka Chicha', 'mgandini', 4),
  ('Rophus Mlanda', 'kimbunga', 4),
  ('Lucky J. Lewa', 'bomaniyouth', 4),
  ('Tobias Jefwa', 'dola', 4),
  ('Lameck Musa', 'revolution', 3),
  ('Mackson Sanga', 'zion', 3),
  ('Victor Shoboi', 'progressive', 3),
  ('Sammy Ngala', 'sunset', 3),
  ('Salim Abae', 'kilifiteachers', 3),
  ('Kingi Kitsao', 'komboa', 3),
  ('James Dede', 'bahariutd', 3),
  ('Kelvin Ngumbao', 'bomaniyouth', 3),
  ('Ali Chinga', 'kanamai', 3),
  ('Andreah Fahari', 'youngheroes', 3),
  ('Rama Chengo', 'fullsun', 3),
  ('George Bora', 'fullsun', 3),
  ('Hashim Kithi', 'fullsun', 3),
  ('Jumaa Yaa', 'bomaniyouth', 3),
  ('Semaj Haluna', 'mtwapaallstars', 3),
  ('Sammy Simiyu', 'mtepeni', 3),
  ('Wycliffe Kenga', 'kicks', 3),
  ('William Lugogo', 'travellers', 3);

-- ---------- SETTINGS: keep the "as of" label in sync ----------
UPDATE settings SET as_of_label = 'as at 17th August 2026' WHERE id = 1;
