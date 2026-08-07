/* =====================================================================
   ADMIN PANEL LOGIC
   Handles login, tab switching, and CRUD for every table. Writes only
   succeed if the visitor is logged in as the admin (enforced by the
   Row Level Security policies in supabase/schema.sql — this file does
   not need to "trust" the client, the database checks it too).
===================================================================== */

let clubsCache = []; // [{id, name, venue}], used to populate <select> dropdowns

/* ---------- small helpers ---------- */
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function esc(s){
  if(s===null || s===undefined) return '';
  return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function clubOptionsHtml(selectedId){
  return `<option value="">Select club…</option>` + clubsCache.map(c=>
    `<option value="${esc(c.id)}" ${c.id===selectedId?'selected':''}>${esc(c.name)}</option>`).join('');
}
function clubName(id){
  const c = clubsCache.find(c=>c.id===id);
  return c ? c.name : id;
}

/* =====================================================================
   AUTH
===================================================================== */
async function checkAuth(){
  const { data:{ session } } = await db.auth.getSession();
  if(session){
    $('#loginScreen').style.display = 'none';
    $('#dashboard').style.display = 'block';
    initDashboard();
  } else {
    $('#loginScreen').style.display = 'flex';
    $('#dashboard').style.display = 'none';
  }
}

$('#loginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const password = $('#loginPassword').value;
  $('#loginError').textContent = '';
  const { error } = await db.auth.signInWithPassword({ email, password });
  if(error){
    $('#loginError').textContent = error.message === 'Invalid login credentials'
      ? 'Incorrect email or password.'
      : error.message;
    return;
  }
  checkAuth();
});

$('#logoutBtn').addEventListener('click', async ()=>{
  await db.auth.signOut();
  checkAuth();
});

/* =====================================================================
   TABS
===================================================================== */
let dashboardInited = false;
function initDashboard(){
  $all('.admin-tabs button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $all('.admin-tabs button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      $all('.admin-panel').forEach(p=>p.style.display = 'none');
      $('#panel-'+btn.dataset.tab).style.display = 'block';
    });
  });

  if(dashboardInited) return; // don't re-attach form listeners / re-fetch on repeat logins
  dashboardInited = true;

  loadClubs();
  loadTableRows();
  loadFixtures();
  loadScorers();
  loadSquads();
  loadNews();
  loadGallery();
  loadSettings();

  setupForm('clubs');
  setupForm('table', {selectDeps:['club_id']});
  setupForm('fixtures', {selectDeps:['home_id','away_id']});
  setupForm('scorers', {selectDeps:['club_id']});
  setupForm('squads', {selectDeps:['club_id']});
  setupForm('news');
  setupSettingsForm();
  setupGalleryUpload();
}

/* =====================================================================
   GENERIC FORM (insert / update) WIRING
===================================================================== */
const TABLE_NAMES = { clubs:'clubs', table:'table_rows', fixtures:'fixtures', scorers:'scorers', squads:'squads', news:'news' };
const PRIMARY_KEY = { clubs:'id', table:'club_id', fixtures:'id', scorers:'id', squads:'id', news:'id' };

function setupForm(key){
  const form = $('#form-'+key);
  const cancelBtn = form.querySelector('[data-cancel-edit]');

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const editingId = fd.get('_editing');
    const payload = {};
    for(const [k,v] of fd.entries()){
      if(k === '_editing') continue;
      payload[k] = v === '' ? null : v;
    }
    // numeric coercion
    ['p','w','d','l','gf','ga','goals','jersey_no'].forEach(f=>{
      if(f in payload && payload[f] !== null) payload[f] = Number(payload[f]);
    });

    const table = TABLE_NAMES[key];
    let error;
    if(editingId){
      if(key === 'clubs'){
        // id is the primary key and shouldn't change on edit
        delete payload.id;
      }
      ({ error } = await db.from(table).update(payload).eq(PRIMARY_KEY[key], editingId));
    } else {
      if(key === 'fixtures' && !payload.id){
        payload.id = 'm' + payload.match_no;
      }
      ({ error } = await db.from(table).insert(payload));
    }

    if(error){ alert('Error: ' + error.message); return; }

    form.reset();
    form.querySelector('[name="_editing"]').value = '';
    cancelBtn.style.display = 'none';
    form.querySelector('button[type=submit]').textContent = defaultSubmitLabel(key);

    if(key === 'clubs') await loadClubs();
    if(key === 'table') loadTableRows();
    if(key === 'fixtures') loadFixtures();
    if(key === 'scorers') loadScorers();
    if(key === 'squads') loadSquads();
    if(key === 'news') loadNews();
  });

  cancelBtn.addEventListener('click', ()=>{
    form.reset();
    form.querySelector('[name="_editing"]').value = '';
    cancelBtn.style.display = 'none';
    form.querySelector('button[type=submit]').textContent = defaultSubmitLabel(key);
  });
}

function defaultSubmitLabel(key){
  return { clubs:'Add Club', table:'Save Row', fixtures:'Add Fixture', scorers:'Add Scorer', squads:'Add Player', news:'Publish' }[key];
}

function startEdit(key, row){
  const form = $('#form-'+key);
  form.querySelector('[name="_editing"]').value = row[PRIMARY_KEY[key]];
  Object.keys(row).forEach(k=>{
    const field = form.querySelector(`[name="${k}"]`);
    if(field) field.value = row[k] ?? '';
  });
  form.querySelector('[data-cancel-edit]').style.display = 'inline-flex';
  form.querySelector('button[type=submit]').textContent = 'Save Changes';
  form.scrollIntoView({ behavior:'smooth', block:'start' });
}

async function deleteRow(key, id){
  if(!confirm('Delete this? This cannot be undone.')) return;
  const { error } = await db.from(TABLE_NAMES[key]).delete().eq(PRIMARY_KEY[key], id);
  if(error){ alert('Error: ' + error.message); return; }
  if(key === 'clubs') await loadClubs();
  if(key === 'table') loadTableRows();
  if(key === 'fixtures') loadFixtures();
  if(key === 'scorers') loadScorers();
  if(key === 'squads') loadSquads();
  if(key === 'news') loadNews();
}

/* =====================================================================
   CLUBS
===================================================================== */
async function loadClubs(){
  const { data, error } = await db.from('clubs').select('*').order('name');
  if(error){ console.error(error); return; }
  clubsCache = data || [];

  // refresh every dropdown that depends on the club list
  $all('select[name="club_id"], select[name="home_id"], select[name="away_id"]').forEach(sel=>{
    const current = sel.value;
    sel.innerHTML = clubOptionsHtml(current);
  });

  const tbl = $('#table-clubs');
  tbl.innerHTML = `
    <tr><th>ID</th><th>Name</th><th>Venue</th><th></th></tr>
    ${clubsCache.map(c=>`
      <tr>
        <td class="mono">${esc(c.id)}</td>
        <td>${esc(c.name)}</td>
        <td>${esc(c.venue||'—')}</td>
        <td class="row-actions">
          <button data-edit>Edit</button>
          <button data-del class="danger">Delete</button>
        </td>
      </tr>`).join('')}`;

  wireRowButtons('#table-clubs', clubsCache, 'clubs');
}

function wireRowButtons(tableSel, rows, key){
  const trs = $all(tableSel + ' tr').slice(1); // skip header row
  trs.forEach((tr,i)=>{
    const row = rows[i];
    const editBtn = tr.querySelector('[data-edit]');
    const delBtn = tr.querySelector('[data-del]');
    if(editBtn) editBtn.addEventListener('click', ()=>startEdit(key, row));
    if(delBtn) delBtn.addEventListener('click', ()=>deleteRow(key, row[PRIMARY_KEY[key]]));
  });
}

/* =====================================================================
   TABLE ROWS
===================================================================== */
async function loadTableRows(){
  const { data, error } = await db.from('table_rows').select('*');
  if(error){ console.error(error); return; }
  const rows = (data||[]).map(r=>({ ...r, gd:r.gf-r.ga, pts:r.w*3+r.d }))
    .sort((a,b)=> b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);

  const tbl = $('#table-table');
  tbl.innerHTML = `
    <tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th></th></tr>
    ${rows.map((r,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>${esc(clubName(r.club_id))}</td>
        <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
        <td>${r.gf}</td><td>${r.ga}</td><td>${r.gd}</td><td>${r.pts}</td>
        <td class="row-actions">
          <button data-edit>Edit</button>
          <button data-del class="danger">Delete</button>
        </td>
      </tr>`).join('')}`;
  wireRowButtons('#table-table', rows, 'table');
}

/* =====================================================================
   FIXTURES
===================================================================== */
async function loadFixtures(){
  const { data, error } = await db.from('fixtures').select('*').order('date').order('match_no');
  if(error){ console.error(error); return; }
  const rows = data || [];
  const today = new Date().toISOString().slice(0,10);

  const tbl = $('#table-fixtures');
  tbl.innerHTML = `
    <tr><th>#</th><th>Date</th><th>Kickoff</th><th>Home</th><th>Away</th><th>Venue</th><th>Status</th><th></th></tr>
    ${rows.map(f=>`
      <tr>
        <td>${esc(f.match_no)}</td>
        <td>${esc(f.date)}</td>
        <td>${esc(f.kickoff||'—')}</td>
        <td>${esc(clubName(f.home_id))}</td>
        <td>${esc(clubName(f.away_id))}</td>
        <td>${esc(f.venue||'—')}</td>
        <td>${f.date < today ? 'Played' : 'Upcoming'}</td>
        <td class="row-actions">
          <button data-edit>Edit</button>
          <button data-del class="danger">Delete</button>
        </td>
      </tr>`).join('')}`;
  wireRowButtons('#table-fixtures', rows, 'fixtures');
}

/* =====================================================================
   SCORERS
===================================================================== */
async function loadScorers(){
  const { data, error } = await db.from('scorers').select('*').order('goals', { ascending:false });
  if(error){ console.error(error); return; }
  const rows = data || [];

  const tbl = $('#table-scorers');
  tbl.innerHTML = `
    <tr><th>Player</th><th>Club</th><th>Goals</th><th></th></tr>
    ${rows.map(s=>`
      <tr>
        <td>${esc(s.player_name)}</td>
        <td>${esc(clubName(s.club_id))}</td>
        <td>${s.goals}</td>
        <td class="row-actions">
          <button data-edit>Edit</button>
          <button data-del class="danger">Delete</button>
        </td>
      </tr>`).join('')}`;
  wireRowButtons('#table-scorers', rows, 'scorers');
}

/* =====================================================================
   SQUADS
===================================================================== */
async function loadSquads(){
  const { data, error } = await db.from('squads').select('*').order('club_id').order('jersey_no');
  if(error){ console.error(error); return; }
  const rows = data || [];

  const tbl = $('#table-squads');
  tbl.innerHTML = `
    <tr><th>Club</th><th>Player</th><th>No.</th><th></th></tr>
    ${rows.map(s=>`
      <tr>
        <td>${esc(clubName(s.club_id))}</td>
        <td>${esc(s.player_name)}</td>
        <td>${s.jersey_no ?? '—'}</td>
        <td class="row-actions">
          <button data-edit>Edit</button>
          <button data-del class="danger">Delete</button>
        </td>
      </tr>`).join('')}`;
  wireRowButtons('#table-squads', rows, 'squads');
}

/* =====================================================================
   NEWS
===================================================================== */
async function loadNews(){
  const { data, error } = await db.from('news').select('*').order('created_at', { ascending:false });
  if(error){ console.error(error); return; }
  const rows = data || [];

  const tbl = $('#table-news');
  tbl.innerHTML = `
    <tr><th>Tag</th><th>Title</th><th></th></tr>
    ${rows.map(n=>`
      <tr>
        <td>${esc(n.tag||'—')}</td>
        <td>${esc(n.title)}</td>
        <td class="row-actions">
          <button data-edit>Edit</button>
          <button data-del class="danger">Delete</button>
        </td>
      </tr>`).join('')}`;
  wireRowButtons('#table-news', rows, 'news');
}

/* =====================================================================
   GALLERY (Supabase Storage + gallery table)
===================================================================== */
function setupGalleryUpload(){
  $('#form-gallery').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const input = $('#galleryFiles');
    const files = Array.from(input.files || []);
    if(!files.length) return;
    const status = $('#galleryUploadStatus');

    let done = 0;
    for(const file of files){
      status.textContent = `Uploading ${done+1} of ${files.length}…`;
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: upErr } = await db.storage.from('gallery').upload(path, file);
      if(upErr){ alert('Upload failed for ' + file.name + ': ' + upErr.message); continue; }
      const { data: pub } = db.storage.from('gallery').getPublicUrl(path);
      await db.from('gallery').insert({ url: pub.publicUrl, caption: '' });
      done++;
    }
    status.textContent = `Done — uploaded ${done} of ${files.length} photo(s).`;
    input.value = '';
    loadGallery();
  });
}

async function loadGallery(){
  const { data, error } = await db.from('gallery').select('*').order('sort_order').order('created_at');
  if(error){ console.error(error); return; }
  const rows = data || [];

  const grid = $('#gallery-grid');
  grid.innerHTML = rows.map(g=>`
    <div class="admin-gallery-item" data-id="${g.id}">
      <img src="${esc(g.url)}" alt="">
      <button type="button" class="danger" data-del-photo title="Delete photo">&times;</button>
      <input type="text" placeholder="Caption…" value="${esc(g.caption||'')}" data-caption>
    </div>`).join('') || `<p class="admin-hint">No photos yet — upload some above.</p>`;

  $all('.admin-gallery-item', grid).forEach((el,i)=>{
    const row = rows[i];
    el.querySelector('[data-del-photo]').addEventListener('click', async ()=>{
      if(!confirm('Delete this photo?')) return;
      const path = row.url.split('/gallery/').pop();
      await db.storage.from('gallery').remove([path]);
      await db.from('gallery').delete().eq('id', row.id);
      loadGallery();
    });
    let saveTimer;
    el.querySelector('[data-caption]').addEventListener('input', (e)=>{
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async ()=>{
        await db.from('gallery').update({ caption: e.target.value }).eq('id', row.id);
      }, 600);
    });
  });
}

/* =====================================================================
   SETTINGS
===================================================================== */
async function loadSettings(){
  const { data, error } = await db.from('settings').select('*').eq('id',1).single();
  if(error){ console.error(error); return; }
  const form = $('#form-settings');
  form.querySelector('[name="season_label"]').value = data?.season_label || '';
  form.querySelector('[name="as_of_label"]').value = data?.as_of_label || '';
}

function setupSettingsForm(){
  $('#form-settings').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await db.from('settings').update({
      season_label: fd.get('season_label'),
      as_of_label: fd.get('as_of_label'),
    }).eq('id', 1);
    if(error){ alert('Error: ' + error.message); return; }
    alert('Settings saved.');
  });
}

/* =====================================================================
   INIT
===================================================================== */
checkAuth();
