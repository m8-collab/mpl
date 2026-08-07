/* =====================================================================
   STORAGE
   This site runs entirely client-side, so predictor picks are persisted
   to this browser's localStorage. "Your picks" persist for you, on this
   device/browser. "Fan tallies" only reflect picks made in THIS browser
   since there is no server — they are not shared across visitors unless
   you wire this up to a real backend (see README.md).
===================================================================== */
const storage = {
  async get(key){
    try{
      const v = localStorage.getItem(key);
      if(v === null) return null;
      return {key, value:v};
    }catch(e){ return null; }
  },
  async set(key, value){
    try{
      localStorage.setItem(key, value);
      return {key, value};
    }catch(e){ return null; }
  }
};

/* ===================== PREDICTOR ===================== */
async function renderPickList(){
  const container = document.getElementById('pickList');
  if(!container) return;
  const ids = (container.dataset.fixtureIds || '').split(',').filter(Boolean);
  const fixtures = ids.map(id => FIXTURES.find(f=>f.id===id)).filter(Boolean);

  if(!fixtures.length){
    container.innerHTML = '<p style="color:var(--ivory-dim);">No upcoming fixtures to predict right now — check back closer to the next matchday.</p>';
    return;
  }

  let myPicks = {};
  try{
    const res = await storage.get('mypicks');
    if(res) myPicks = JSON.parse(res.value);
  }catch(e){}

  const cardsHtml = await Promise.all(fixtures.map(async (f)=>{
    let counts = {home:0, away:0};
    try{
      const res = await storage.get('pickcounts:'+f.id);
      if(res) counts = JSON.parse(res.value);
    }catch(e){}
    const total = counts.home + counts.away;
    const pctHome = total ? Math.round(counts.home/total*100) : 0;
    const pctAway = total ? Math.round(counts.away/total*100) : 0;
    const chosen = myPicks[f.id];
    return `
    <div class="pick-card" data-game="${f.id}">
      <div class="eyebrow">MATCH #${f.matchNo} &middot; ${fmtDate(f.date)}</div>
      <div class="pick-options">
        <button class="pick-btn ${chosen==='home'?'chosen':''}" data-side="home" data-game="${f.id}">
          <span class="nm">${CLUB_MAP[f.home].name}</span>
          <span class="pct">${pctHome}% of picks &middot; ${counts.home} total</span>
        </button>
        <button class="pick-btn ${chosen==='away'?'chosen':''}" data-side="away" data-game="${f.id}">
          <span class="nm">${CLUB_MAP[f.away].name}</span>
          <span class="pct">${pctAway}% of picks &middot; ${counts.away} total</span>
        </button>
      </div>
    </div>`;
  }));

  container.innerHTML = cardsHtml.join('');

  container.querySelectorAll('.pick-btn').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const gid = btn.dataset.game;
      const side = btn.dataset.side;
      const already = myPicks[gid];
      if(already === side) return;
      try{
        let counts = {home:0, away:0};
        const res = await storage.get('pickcounts:'+gid);
        if(res) counts = JSON.parse(res.value);
        if(already){ counts[already] = Math.max(0, counts[already]-1); }
        counts[side] = (counts[side]||0) + 1;
        await storage.set('pickcounts:'+gid, JSON.stringify(counts));
        myPicks[gid] = side;
        await storage.set('mypicks', JSON.stringify(myPicks));
      }catch(e){ console.error('Storage error', e); }
      renderPickList();
    });
  });
}

/* ===================== GALLERY / LIGHTBOX ===================== */
function initGallery(){
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const tiles = Array.from(document.querySelectorAll('.photo-tile'));
  if(!lightbox || !tiles.length) return;
  const photos = window.__currentAlbumPhotos || GALLERY_PHOTOS;
  let current = 0;

  function open(i){
    current = i;
    img.src = photos[current].src;
    img.alt = photos[current].cap;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  function step(delta){
    current = (current + delta + photos.length) % photos.length;
    img.src = photos[current].src;
    img.alt = photos[current].cap;
  }

  tiles.forEach(t=>t.addEventListener('click', ()=>open(Number(t.dataset.index))));
  document.getElementById('lightboxClose').addEventListener('click', close);
  document.getElementById('lightboxPrev').addEventListener('click', ()=>step(-1));
  document.getElementById('lightboxNext').addEventListener('click', ()=>step(1));
  lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) close(); });
  document.addEventListener('keydown', (e)=>{
    if(!lightbox.classList.contains('open')) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') step(-1);
    if(e.key === 'ArrowRight') step(1);
  });
}

/* ===================== ROUTER ===================== */
const routes = {
  '/': viewHome,
  '/table': viewTable,
  '/fixtures': viewFixtures,
  '/clubs': viewClubs,
  '/scorers': viewScorers,
  '/news': viewNews,
  '/gallery': viewGallery,
  '/about': viewAbout,
  '/predictor': viewPredictor,
};

function render(){
  const hash = location.hash.replace('#','') || '/';
  const app = document.getElementById('app');

  document.querySelectorAll('nav.links a').forEach(a=>{
    const navTarget = hash.startsWith('/club/') ? '/clubs' : (hash.startsWith('/gallery/') ? '/gallery' : hash);
    a.classList.toggle('active', a.getAttribute('href') === '#'+navTarget);
  });

  if(hash.startsWith('/club/')){
    const id = hash.split('/')[2];
    app.innerHTML = viewClubDetail(id);
  } else if(hash.startsWith('/gallery/')){
    const id = hash.split('/')[2];
    app.innerHTML = viewGalleryAlbum(id);
  } else if(routes[hash]){
    app.innerHTML = routes[hash]();
  } else {
    app.innerHTML = viewHome();
  }

  window.scrollTo({top:0, behavior:'instant'});

  if(hash === '/predictor'){ renderPickList(); }
  if(hash.startsWith('/gallery/')){ initGallery(); }

  document.getElementById('navLinks').classList.remove('open');
}

function updateChrome(){
  document.getElementById('brandSeason').textContent = SEASON_LABEL.toUpperCase();
  document.getElementById('footerSeason').textContent = `${SEASON_LABEL.toUpperCase()} \u00B7 ${CLUBS.length} CLUBS, ONE TABLE.`;
  document.getElementById('footerDisclaimer').textContent = `TABLE, FIXTURES & TOP SCORERS REFLECT LIVE LEAGUE DATA, ${AS_OF_LABEL.toUpperCase()}.`;
}

function buildTicker(){
  const track = document.getElementById('tickerTrack');
  // Use the real table's current leaders + upcoming fixtures for the ticker,
  // since individual historical scorelines weren't published.
  const leaders = TABLE.slice(0,6);
  const items = leaders.map(r=>`
    <span class="tick-item"><b>${r.rank}. ${CLUB_MAP[r.id].name}</b> ${r.pts} PTS <span class="fin">${r.w}W ${r.d}D ${r.l}L</span></span>`).join('');
  track.innerHTML = items + items;
}

/* ===================== LIVE UPDATES ===================== */
/* Whenever the admin adds/edits/deletes anything, Supabase pushes a
   realtime notification here and the whole site quietly refreshes —
   no page reload needed, for every visitor currently on the site. */
let liveReloadTimer = null;
function scheduleLiveReload(){
  // Debounce: if several edits land in the same moment, only refetch once.
  clearTimeout(liveReloadTimer);
  liveReloadTimer = setTimeout(async ()=>{
    try{
      await loadAllData();
      updateChrome();
      buildTicker();
      render();
    }catch(e){ console.error('Live reload failed', e); }
  }, 400);
}

function subscribeLiveUpdates(){
  const tables = ['clubs','table_rows','scorers','fixtures','squads','news','gallery','settings'];
  const channel = db.channel('public-site-updates');
  tables.forEach(t=>{
    channel.on('postgres_changes', { event:'*', schema:'public', table:t }, scheduleLiveReload);
  });
  channel.subscribe();
}

/* ===================== INIT ===================== */
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', async ()=>{
  const app = document.getElementById('app');
  app.innerHTML = `<section style="padding-top:80px;text-align:center;"><p class="mono" style="color:var(--ivory-dim);">LOADING LEAGUE DATA…</p></section>`;

  try{
    await loadAllData();
  }catch(e){
    app.innerHTML = `<section style="padding-top:80px;text-align:center;">
      <p style="color:var(--claret-br);">Could not load league data. Check your internet connection, or the site owner needs to check the Supabase configuration in js/supabase-client.js.</p>
    </section>`;
    return;
  }

  updateChrome();
  buildTicker();
  render();
  subscribeLiveUpdates();

  document.getElementById('navToggle').addEventListener('click', ()=>{
    document.getElementById('navLinks').classList.toggle('open');
  });
});
