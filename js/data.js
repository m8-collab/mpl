/* =====================================================================
   MTWAPA PREMIER LEAGUE — LIVE DATA (Supabase-backed)

   All league data (clubs, table, fixtures, scorers, squads, news,
   gallery) now lives in your Supabase database instead of being
   hardcoded here. This file fetches it and computes the same derived
   values (ranks, points, colors) that views.js and main.js expect.

   To change content day-to-day, use admin.html — NOT this file.
   This file only needs editing if you change the database structure.
===================================================================== */

let SEASON_LABEL = '';
let AS_OF_LABEL = '';

let CLUBS = [];
let CLUB_MAP = {};
let TABLE = [];
let TABLE_MAP = {};
let PREV_RANK = {};
let GOLDEN_BOOT = [];
let FIXTURES = [];
let SQUADS_MAP = {};
let NEWS = [];
let GALLERY_PHOTOS = [];
let ALBUMS = [];          // [{id, name, description, cover, count}]
let PHOTOS_BY_ALBUM = {}; // { [albumId]: [{id, src, cap}] }

/* ---------- helpers used by views.js / main.js ---------- */
const PALETTE = ['#c94a2f','#3a5fc9','#2f8c5a','#e3a930','#7a4fc9','#1f6e8c','#b5232f','#4fa8c9',
  '#8c3a5c','#5c6b7a','#0d7d78','#d4a017','#3a3a8c','#4a4f57','#ef5b4e','#1c2b3a'];
function colorForId(id){
  let h = 0;
  for(let i=0;i<id.length;i++){ h = (h*31 + id.charCodeAt(i)) >>> 0; }
  return PALETTE[h % PALETTE.length];
}

function zoneFor(rank){
  if(rank<=3) return 'zone-ucl';                          // top-3 highlight
  if(TABLE.length && rank >= TABLE.length-2) return 'zone-rel'; // bottom-3, whatever the current club count is
  return '';
}

function fixturesByDate(){
  const groups = {};
  FIXTURES.forEach(f=>{
    if(!groups[f.date]) groups[f.date] = [];
    groups[f.date].push(f);
  });
  return Object.entries(groups).sort((a,b)=> a[0].localeCompare(b[0]));
}

function todayISO(){
  return new Date().toISOString().slice(0,10);
}
function isFixturePlayed(f){
  return f.date < todayISO();
}

function generateSquad(clubId){
  const list = SQUADS_MAP[clubId];
  if(!list || !list.length) return null;
  return list;
}

/* ---------- crest images ----------
   Static files bundled in the repo under assets/crests/. Any club id not
   listed here just falls back to the colored-initials swatch, so adding
   more crests later is a matter of dropping a file in and adding a line. */
const CRESTS = {
  travellers: 'assets/crests/travellers.jpg',
  revolution: 'assets/crests/revolution.jpg',
  laliga: 'assets/crests/laliga.jpg',
  newtalent: 'assets/crests/newtalent.jpg',
  mgandini: 'assets/crests/mgandini.jpg',
  mpatempate: 'assets/crests/mpatempate.jpg',
  mtwapaallstars: 'assets/crests/mtwapaallstars.jpg',
  kilifiteachers: 'assets/crests/kilifiteachers.jpg',
  mikanjuni: 'assets/crests/mikanjuni.jpg',
  bahariutd: 'assets/crests/bahariutd.jpg',
  fuhua: 'assets/crests/fuhua.jpg',
  baraza: 'assets/crests/baraza.jpg',
  kicks: 'assets/crests/kicks.jpg',
  mtepeni: 'assets/crests/mtepeni.jpg',
  dola: 'assets/crests/dola.jpg',
};

function esc(s){
  if(s===null || s===undefined) return '';
  return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ---------- fetch + compute everything from Supabase ---------- */
async function loadAllData(){
  const [
    { data: clubsData, error: e1 },
    { data: tableRowsData, error: e2 },
    { data: scorersData, error: e3 },
    { data: fixturesData, error: e4 },
    { data: squadsData, error: e5 },
    { data: newsData, error: e6 },
    { data: galleryData, error: e7 },
    { data: settingsData, error: e8 },
    { data: albumsData, error: e9 },
  ] = await Promise.all([
    db.from('clubs').select('*'),
    db.from('table_rows').select('*'),
    db.from('scorers').select('*'),
    db.from('fixtures').select('*'),
    db.from('squads').select('*').order('jersey_no'),
    db.from('news').select('*').order('created_at', { ascending:false }),
    db.from('gallery').select('*').order('sort_order').order('created_at'),
    db.from('settings').select('*').eq('id',1).single(),
    db.from('albums').select('*').order('sort_order').order('created_at'),
  ]);

  const firstError = e1||e2||e3||e4||e5||e6||e7||e8;
  if(firstError){
    console.error('Supabase load error:', firstError);
    throw firstError;
  }
  // e9 (albums) is allowed to fail quietly — if the gallery-albums.sql
  // migration hasn't been run yet, the site still works, just with an
  // empty albums list instead of erroring the whole page out.
  if(e9) console.warn('Albums not loaded (has supabase/gallery-albums.sql been run yet?)', e9);

  // Settings
  SEASON_LABEL = (settingsData && settingsData.season_label) || 'Mtwapa Premier League';
  AS_OF_LABEL  = (settingsData && settingsData.as_of_label) || '';

  // Clubs (+ deterministic colors + crest image if we have one)
  const clubsRaw = clubsData || [];
  CLUB_MAP = {};
  clubsRaw.forEach(c=>{ CLUB_MAP[c.id] = { ...c, color: colorForId(c.id), crest: CRESTS[c.id] || null }; });

  // Table — recomputed rank from points / goal difference / goals for
  const rows = (tableRowsData || [])
    .filter(r => CLUB_MAP[r.club_id])
    .map(r=>{
      const gd = r.gf - r.ga;
      const pts = r.w*3 + r.d;
      return { id:r.club_id, p:r.p, w:r.w, d:r.d, l:r.l, gf:r.gf, ga:r.ga, gd, pts };
    });
  rows.sort((a,b)=> b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
  TABLE = rows.map((r,i)=>({ ...r, rank:i+1, form5:[] }));
  TABLE_MAP = Object.fromEntries(TABLE.map(r=>[r.id, r]));
  PREV_RANK = Object.fromEntries(TABLE.map(r=>[r.id, r.rank])); // flat movers (no history tracked)

  // Clubs listing order: follow table order, then any un-ranked club alphabetically
  const rankedIds = TABLE.map(r=>r.id);
  const remaining = clubsRaw.map(c=>c.id).filter(id=>!rankedIds.includes(id)).sort();
  CLUBS = [...rankedIds, ...remaining].map(id=>CLUB_MAP[id]).filter(Boolean);

  // Scorers
  GOLDEN_BOOT = (scorersData || [])
    .filter(s=>CLUB_MAP[s.club_id])
    .map(s=>({ player:{ name:s.player_name, club:s.club_id }, club:CLUB_MAP[s.club_id], goals:s.goals }))
    .sort((a,b)=> b.goals - a.goals);

  // Fixtures
  FIXTURES = (fixturesData || [])
    .filter(f=>CLUB_MAP[f.home_id] && CLUB_MAP[f.away_id])
    .map(f=>({ id:f.id, matchNo:f.match_no, date:f.date, home:f.home_id, away:f.away_id, venue:f.venue, kickoff:f.kickoff }))
    .sort((a,b)=> a.date.localeCompare(b.date) || String(a.matchNo).localeCompare(String(b.matchNo)));

  // Squads
  SQUADS_MAP = {};
  (squadsData || []).forEach(s=>{
    if(!CLUB_MAP[s.club_id]) return;
    if(!SQUADS_MAP[s.club_id]) SQUADS_MAP[s.club_id] = [];
    SQUADS_MAP[s.club_id].push({ name:s.player_name, num:s.jersey_no });
  });

  // News
  NEWS = (newsData || []).map(n=>({ tag:n.tag, title:n.title, body:n.body }));

  // Gallery — flat list (kept for backward compatibility) + grouped by album
  GALLERY_PHOTOS = (galleryData || []).map(g=>({ src:g.url, cap:g.caption || '' }));

  const albumsRaw = albumsData || [];
  const photosRaw = galleryData || [];

  PHOTOS_BY_ALBUM = {};
  photosRaw.forEach(g=>{
    const key = g.album_id || 'none';
    if(!PHOTOS_BY_ALBUM[key]) PHOTOS_BY_ALBUM[key] = [];
    PHOTOS_BY_ALBUM[key].push({ id:g.id, src:g.url, cap:g.caption || '' });
  });

  ALBUMS = albumsRaw.map(a=>{
    const photos = PHOTOS_BY_ALBUM[a.id] || [];
    return {
      id: a.id,
      name: a.name,
      description: a.description || '',
      count: photos.length,
      cover: photos[0] ? photos[0].src : null,
    };
  }).filter(a=>a.count > 0); // hide empty albums on the public site
}
