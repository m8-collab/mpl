-- =====================================================================
-- SQUAD PLAYERS WITH PHOTOS — AMA-4 FC & Fuhua FC
-- Run AFTER supabase/player-photos.sql.
--
-- Only these two clubs are included this round. Photos were matched to
-- names by position in a regular photo grid, verified against an exact
-- count match (48 photos / 48 names for AMA-4, 24 / 24 for Fuhua) plus
-- visual spot-checks. The other clubs sent in this batch had PDFs with
-- inconsistent layouts (decorative template graphics mixed in with
-- photos, whole-page flattened images, or two rosters bundled in one
-- file) where I couldn't get a reliable match without risking
-- attaching the wrong photo to the wrong name — see the chat for
-- details on what's needed to finish those.
--
-- Paths point to assets/players/<club>/NNN.jpg, bundled in the repo —
-- no Storage upload needed, same pattern as the club crests.
-- =====================================================================

INSERT INTO squads (club_id, player_name, photo_url) VALUES
  ('ama4', 'Briton Nyando',     'assets/players/ama4/000.jpg'),
  ('ama4', 'Fredrick Mwalao',   'assets/players/ama4/001.jpg'),
  ('ama4', 'Wambua Mataka',     'assets/players/ama4/002.jpg'),
  ('ama4', 'Emmanuel Jefwa',    'assets/players/ama4/003.jpg'),
  ('ama4', 'Brolly Bronscos',   'assets/players/ama4/004.jpg'),
  ('ama4', 'Benard Mwandango',  'assets/players/ama4/005.jpg'),
  ('ama4', 'Dennis Deche',      'assets/players/ama4/006.jpg'),
  ('ama4', 'Jillo Geggoh',      'assets/players/ama4/007.jpg'),
  ('ama4', 'Rodger Odhiambo',   'assets/players/ama4/008.jpg'),
  ('ama4', 'Festus Mutinda',    'assets/players/ama4/009.jpg'),
  ('ama4', 'Evans Kiptoo',      'assets/players/ama4/010.jpg'),
  ('ama4', 'David Nyale',       'assets/players/ama4/011.jpg'),
  ('ama4', 'Brighton Geggoh',   'assets/players/ama4/012.jpg'),
  ('ama4', 'Salim Halfan',      'assets/players/ama4/013.jpg'),
  ('ama4', 'John Charo',        'assets/players/ama4/014.jpg'),
  ('ama4', 'Davis Wanyama',     'assets/players/ama4/015.jpg'),
  ('ama4', 'Boniface Kanijo',   'assets/players/ama4/016.jpg'),
  ('ama4', 'Lennox Ngao',       'assets/players/ama4/017.jpg'),
  ('ama4', 'Martin Munga',      'assets/players/ama4/018.jpg'),
  ('ama4', 'Emmanuel Kombe',    'assets/players/ama4/019.jpg'),
  ('ama4', 'Simon Emmanuel',    'assets/players/ama4/020.jpg'),
  ('ama4', 'Alex Chilumo',      'assets/players/ama4/021.jpg'),
  ('ama4', 'Thomas Ongechi',    'assets/players/ama4/022.jpg'),
  ('ama4', 'Adolf Shake',       'assets/players/ama4/023.jpg'),
  ('ama4', 'Daniel Nyongesa',   'assets/players/ama4/024.jpg'),
  ('ama4', 'Baraka Kiringi',    'assets/players/ama4/025.jpg'),
  ('ama4', 'Jeremiah Kazungu',  'assets/players/ama4/026.jpg'),
  ('ama4', 'Benson Meendwa',    'assets/players/ama4/027.jpg'),
  ('ama4', 'Rashid Macho',      'assets/players/ama4/028.jpg'),
  ('ama4', 'Yusuf Dadi',        'assets/players/ama4/029.jpg'),
  ('ama4', 'James Karisa',      'assets/players/ama4/030.jpg'),
  ('ama4', 'Peter Mambo',       'assets/players/ama4/031.jpg'),
  ('ama4', 'Amani Dinho',       'assets/players/ama4/032.jpg'),
  ('ama4', 'Amos Thomas',       'assets/players/ama4/033.jpg'),
  ('ama4', 'Festus Olale',      'assets/players/ama4/034.jpg'),
  ('ama4', 'Shuku Gona',        'assets/players/ama4/035.jpg'),
  ('ama4', 'Paul Wambani',      'assets/players/ama4/036.jpg'),
  ('ama4', 'Ali Jillo',         'assets/players/ama4/037.jpg'),
  ('ama4', 'Simon Safari',      'assets/players/ama4/038.jpg'),
  ('ama4', 'Hussein Chega',     'assets/players/ama4/039.jpg'),
  ('ama4', 'Jamlick Meendwa',   'assets/players/ama4/040.jpg'),
  ('ama4', 'Hussien Gerald',    'assets/players/ama4/041.jpg'),
  ('ama4', 'Jumaa Yaa',         'assets/players/ama4/042.jpg'),
  ('ama4', 'Khamis Katana',     'assets/players/ama4/043.jpg'),
  ('ama4', 'Fikirini Kithingi', 'assets/players/ama4/044.jpg'),
  ('ama4', 'Johnstone Vugigi',  'assets/players/ama4/045.jpg'),
  ('ama4', 'Peter Mutua',       'assets/players/ama4/046.jpg'),
  ('ama4', 'Kibaki Ndoro',      'assets/players/ama4/047.jpg'),

  ('fuhua', 'Huncho Joshua',   'assets/players/fuhua/000.jpg'),
  ('fuhua', 'Elvis Odero',     'assets/players/fuhua/001.jpg'),
  ('fuhua', 'Ondulo Otsula',   'assets/players/fuhua/002.jpg'),
  ('fuhua', 'Anthony Pepez',   'assets/players/fuhua/003.jpg'),
  ('fuhua', 'Elija Zushi',     'assets/players/fuhua/004.jpg'),
  ('fuhua', 'Ray K.D.B',       'assets/players/fuhua/005.jpg'),
  ('fuhua', 'Amin Jeffa',      'assets/players/fuhua/006.jpg'),
  ('fuhua', 'Raphael Omollo',  'assets/players/fuhua/007.jpg'),
  ('fuhua', 'Noman Wafula',    'assets/players/fuhua/008.jpg'),
  ('fuhua', 'Steve Okutaa',    'assets/players/fuhua/009.jpg'),
  ('fuhua', 'Syllas Ouma',     'assets/players/fuhua/010.jpg'),
  ('fuhua', 'Suleiman Jnr',    'assets/players/fuhua/011.jpg'),
  ('fuhua', 'Yussuf Ziro',     'assets/players/fuhua/012.jpg'),
  ('fuhua', 'Erick Jombaa',    'assets/players/fuhua/013.jpg'),
  ('fuhua', 'Davii Jnr',       'assets/players/fuhua/014.jpg'),
  ('fuhua', 'John Mwanja',     'assets/players/fuhua/015.jpg'),
  ('fuhua', 'David Ouru',      'assets/players/fuhua/016.jpg'),
  ('fuhua', 'Jay Ndichu',      'assets/players/fuhua/017.jpg'),
  ('fuhua', 'Wekesa Jr',       'assets/players/fuhua/018.jpg'),
  ('fuhua', 'E. Manucho',      'assets/players/fuhua/019.jpg'),
  ('fuhua', 'Johnte Simiyu',   'assets/players/fuhua/020.jpg'),
  ('fuhua', 'Astee Wafula',    'assets/players/fuhua/021.jpg'),
  ('fuhua', 'Luck Masha',      'assets/players/fuhua/022.jpg'),
  ('fuhua', 'Ramaa Hassan',    'assets/players/fuhua/023.jpg');
