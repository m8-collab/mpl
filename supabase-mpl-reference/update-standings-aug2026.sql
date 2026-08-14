-- =====================================================================
-- MTWAPA PREMIER LEAGUE — STANDINGS & SCORERS REFRESH (as at August 2026)
-- Run this ONCE in the SQL Editor to update the live table and Golden
-- Boot to match the latest published standings/scorers sheets.
-- Safe to re-run later with a fresh sheet — table_rows are UPDATEs
-- (by club_id, which never changes), and scorers are fully replaced.
-- =====================================================================

-- ---------- LEAGUE TABLE ----------
UPDATE table_rows SET p=10, w=10, d=0, l=0, gf=22, ga=0  WHERE club_id='travellers';
UPDATE table_rows SET p=11, w=7,  d=1, l=3, gf=23, ga=8  WHERE club_id='bahariutd';
UPDATE table_rows SET p=10, w=7,  d=1, l=2, gf=22, ga=9  WHERE club_id='laliga';
UPDATE table_rows SET p=10, w=6,  d=3, l=1, gf=11, ga=5  WHERE club_id='mgandini';
UPDATE table_rows SET p=10, w=6,  d=1, l=3, gf=18, ga=8  WHERE club_id='mvitaoil';
UPDATE table_rows SET p=9,  w=5,  d=3, l=1, gf=14, ga=7  WHERE club_id='mtwapaseniors';
UPDATE table_rows SET p=10, w=5,  d=3, l=2, gf=10, ga=6  WHERE club_id='fuhua';
UPDATE table_rows SET p=9,  w=5,  d=1, l=3, gf=16, ga=14 WHERE club_id='revolution';
UPDATE table_rows SET p=8,  w=4,  d=3, l=1, gf=17, ga=11 WHERE club_id='kanamai';
UPDATE table_rows SET p=9,  w=4,  d=3, l=2, gf=16, ga=11 WHERE club_id='fullsun';
UPDATE table_rows SET p=9,  w=4,  d=3, l=2, gf=10, ga=7  WHERE club_id='mpatempate';
UPDATE table_rows SET p=10, w=4,  d=3, l=3, gf=12, ga=11 WHERE club_id='bomaniyouth';
UPDATE table_rows SET p=8,  w=4,  d=2, l=2, gf=16, ga=6  WHERE club_id='kicks';
UPDATE table_rows SET p=9,  w=3,  d=5, l=1, gf=12, ga=8  WHERE club_id='kimbunga';
UPDATE table_rows SET p=10, w=3,  d=4, l=3, gf=13, ga=8  WHERE club_id='progressive';
UPDATE table_rows SET p=10, w=3,  d=3, l=4, gf=11, ga=14 WHERE club_id='youngheroes';
UPDATE table_rows SET p=10, w=3,  d=2, l=5, gf=14, ga=13 WHERE club_id='zion';
UPDATE table_rows SET p=8,  w=3,  d=2, l=3, gf=13, ga=12 WHERE club_id='kilifiteachers';
UPDATE table_rows SET p=9,  w=3,  d=2, l=4, gf=10, ga=12 WHERE club_id='ama4';
UPDATE table_rows SET p=9,  w=3,  d=2, l=4, gf=9,  ga=12 WHERE club_id='majaoni';
UPDATE table_rows SET p=10, w=3,  d=2, l=5, gf=10, ga=17 WHERE club_id='sunset';
UPDATE table_rows SET p=11, w=2,  d=3, l=6, gf=10, ga=18 WHERE club_id='komboa';
UPDATE table_rows SET p=10, w=3,  d=0, l=7, gf=13, ga=23 WHERE club_id='posterrangers';
UPDATE table_rows SET p=9,  w=1,  d=5, l=3, gf=11, ga=15 WHERE club_id='mtepeni';
UPDATE table_rows SET p=8,  w=2,  d=2, l=4, gf=12, ga=18 WHERE club_id='dola';
UPDATE table_rows SET p=10, w=2,  d=1, l=7, gf=14, ga=21 WHERE club_id='mikanjuni';
UPDATE table_rows SET p=9,  w=2,  d=1, l=6, gf=6,  ga=23 WHERE club_id='mega';
UPDATE table_rows SET p=7,  w=2,  d=0, l=5, gf=9,  ga=14 WHERE club_id='newtalent';
UPDATE table_rows SET p=10, w=1,  d=3, l=6, gf=8,  ga=18 WHERE club_id='ambassadors';
UPDATE table_rows SET p=10, w=1,  d=1, l=8, gf=11, ga=23 WHERE club_id='mtwapaallstars';
UPDATE table_rows SET p=10, w=1,  d=2, l=7, gf=6,  ga=27 WHERE club_id='baraza';

-- ---------- TOP SCORERS (full replace — clears the old list first) ----------
DELETE FROM scorers;

INSERT INTO scorers (player_name, club_id, goals) VALUES
  ('Phidel Onyango', 'mvitaoil', 8),
  ('Walter Ichela', 'mtwapaseniors', 7),
  ('Jackson Kabaka', 'bahariutd', 6),
  ('Ibra Nyanje', 'laliga', 6),
  ('Shebani Mwagandi', 'laliga', 5),
  ('Athman', 'progressive', 5),
  ('Remi Kenga', 'travellers', 5),
  ('Steven David', 'revolution', 5),
  ('Bernard Deche', 'kanamai', 5),
  ('Maxwell Muye', 'zion', 5),
  ('Lucky Rajab', 'mikanjuni', 5),
  ('Austerious Wafula', 'fuhua', 4),
  ('Amani Chengo', 'laliga', 4),
  ('Omar Abdalla', 'kicks', 4),
  ('Victor Chege', 'mega', 4),
  ('Baraka Chicha', 'mgandini', 4),
  ('Rophus Mlanda', 'kimbunga', 4),
  ('Quinton Kambu', 'revolution', 3),
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
  ('Tobias Jefwa', 'dola', 3),
  ('Allan Leba', 'kimbunga', 3),
  ('Semaj Haluna', 'mtwapaallstars', 3),
  ('William Lugogo', 'travellers', 3);

-- ---------- SETTINGS: keep the "as of" label in sync ----------
UPDATE settings SET as_of_label = 'as at August 2026' WHERE id = 1;
