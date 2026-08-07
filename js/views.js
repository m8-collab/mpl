/* ===================== PHOTOS ===================== */
/* Free-to-use stock photography (Pexels), generic sport/stadium/pitch imagery. */
const PHOTOS = {
  heroStadium:  'https://images.pexels.com/photos/30651230/pexels-photo-30651230.jpeg?auto=compress&cs=tinysrgb&w=1600',
  nightPitch:   'https://images.pexels.com/photos/41257/pexels-photo-41257.jpeg?auto=compress&cs=tinysrgb&w=1200',
  aerialPitch:  'https://images.pexels.com/photos/12039814/pexels-photo-12039814.jpeg?auto=compress&cs=tinysrgb&w=1200',
  crowdFans:    'https://images.pexels.com/photos/19191521/pexels-photo-19191521.jpeg?auto=compress&cs=tinysrgb&w=1200',
  sprinklers:   'https://images.pexels.com/photos/33471345/pexels-photo-33471345.jpeg?auto=compress&cs=tinysrgb&w=1200',
  training:     'https://images.pexels.com/photos/14115020/pexels-photo-14115020.jpeg?auto=compress&cs=tinysrgb&w=1200',
  aerialStadium:'https://images.pexels.com/photos/9735500/pexels-photo-9735500.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ballClose:    'https://images.pexels.com/photos/27170399/pexels-photo-27170399.jpeg?auto=compress&cs=tinysrgb&w=1200',
};

/* ===================== HELPERS ===================== */
function swatch(id){ return `<span class="swatch" style="background:${CLUB_MAP[id].color}"></span>`; }
function ordinalSuffix(n){
  const s=["th","st","nd","rd"], v=n%100;
  return s[(v-20)%10]||s[v]||s[0];
}
function fmtDate(iso){
  const d = new Date(iso+'T00:00:00');
  return d.toLocaleDateString('en-GB', {weekday:'short', day:'2-digit', month:'short'});
}
function moverTag(id, rank){
  const prev = PREV_RANK[id] ?? rank;
  const delta = prev - rank;
  if(delta>0) return `<span class="mover up">&#9650;${delta}</span>`;
  if(delta<0) return `<span class="mover down">&#9660;${Math.abs(delta)}</span>`;
  return `<span class="mover flat">&#9679;</span>`;
}

function tableRowsHtml(rows){
  return rows.map(r=>`
    <tr class="${zoneFor(r.rank)}">
      <td class="pos">${r.rank}</td>
      <td class="club-cell"><a href="#/club/${r.id}" style="display:flex;align-items:center;gap:10px;">${swatch(r.id)} ${CLUB_MAP[r.id].name}</a></td>
      <td class="num">${r.p}</td>
      <td class="num">${r.w}</td>
      <td class="num">${r.d}</td>
      <td class="num">${r.l}</td>
      <td class="num">${r.gf}</td>
      <td class="num">${r.ga}</td>
      <td class="num">${r.gd>0?'+':''}${r.gd}</td>
      <td class="num" style="color:var(--gold);font-weight:600;">${r.pts}</td>
    </tr>`).join('');
}

function tableLegend(){
  return `
  <div class="table-legend">
    <span><span class="legend-swatch" style="background:var(--gold);"></span>Top 3</span>
    <span><span class="legend-swatch" style="background:var(--claret-br);"></span>Bottom 3</span>
  </div>`;
}

function fixtureCardHtml(f){
  const played = isFixturePlayed(f);
  return `
  <div class="match-card">
    <div class="match-row">
      <div class="match-team">${swatch(f.home)}<span>${CLUB_MAP[f.home].name}</span></div>
      <span class="match-vs">${played ? 'FT' : 'V'}</span>
      <div class="match-team" style="justify-content:flex-end;text-align:right;"><span>${CLUB_MAP[f.away].name}</span>${swatch(f.away)}</div>
    </div>
    <div class="match-status">MATCH #${f.matchNo} &middot; ${f.venue} &middot; ${f.kickoff} &middot; ${played ? 'PLAYED' : 'UPCOMING'}</div>
  </div>`;
}

/* ===================== VIEWS ===================== */
function viewHome(){
  const top6 = TABLE.slice(0,6);
  const upcoming = FIXTURES.filter(f=>!isFixturePlayed(f)).slice(0,6);
  const recentPlayed = FIXTURES.filter(f=>isFixturePlayed(f)).slice(-6);
  const top3Scorers = GOLDEN_BOOT.slice(0,5);

  return `
  <section class="hero pitch-lines">
    <div class="photo-hero" style="background-image:url('${PHOTOS.heroStadium}')"></div>
    <div class="eyebrow">${SEASON_LABEL.toUpperCase()} — MTWAPA PREMIER LEAGUE</div>
    <div class="hero-grid" style="margin-top:16px;">
      <div>
        <h1>ONE TABLE.<br><em>26 CLUBS.</em></h1>
        <p class="lede">The Mtwapa Premier League — real clubs, real results, one table that never lies. Follow the title race, the Golden Boot chase, and the fight at the bottom.</p>
        <div class="hero-cta">
          <a href="#/table" class="btn solid">Full Table</a>
          <a href="#/fixtures" class="btn">Fixtures</a>
        </div>
      </div>
      <table class="league-table">
        <caption>Top of the Table</caption>
        <thead><tr><th>#</th><th>Club</th><th class="num">P</th><th class="num">Pts</th></tr></thead>
        <tbody>
          ${top6.map(r=>`
            <tr class="${zoneFor(r.rank)}">
              <td class="pos">${r.rank}</td>
              <td class="club-cell">${swatch(r.id)} ${CLUB_MAP[r.id].name}</td>
              <td class="num">${r.p}</td>
              <td class="num" style="color:var(--gold);font-weight:600;">${r.pts}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <section>
    <div class="section-head">
      <div><div class="eyebrow">GOLDEN BOOT</div><h2 style="margin-top:6px;">Top Scorers</h2></div>
      <a href="#/scorers" class="btn">Full List</a>
    </div>
    <table class="league-table">
      <thead><tr><th>#</th><th>Player</th><th>Club</th><th class="num">Goals</th></tr></thead>
      <tbody>
        ${top3Scorers.map((s,i)=>`
          <tr>
            <td class="pos">${i+1}</td>
            <td class="club-cell">${s.player.name}</td>
            <td>${swatch(s.club.id)} ${s.club.name}</td>
            <td class="num" style="color:var(--gold);font-weight:600;">${s.goals}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </section>

  <section>
    <div class="section-head">
      <div><div class="eyebrow">UPCOMING</div><h2 style="margin-top:6px;">Next Fixtures</h2></div>
      <a href="#/fixtures" class="btn">All Fixtures</a>
    </div>
    ${upcoming.length ? upcoming.map(fixtureCardHtml).join('') : '<p style="color:var(--ivory-dim);">No upcoming fixtures on file yet.</p>'}
  </section>

  <section>
    <div class="section-head">
      <div><div class="eyebrow">AROUND THE GROUNDS</div><h2 style="margin-top:6px;">Matchday Gallery</h2></div>
    </div>
    <div class="gallery-grid">
      <a href="#/fixtures"><img src="${PHOTOS.heroStadium}" alt="" loading="lazy"><span class="gallery-cap">Matchday Atmosphere</span></a>
      <a href="#/table"><img src="${PHOTOS.aerialPitch}" alt="" loading="lazy"><span class="gallery-cap">Aerial View</span></a>
      <a href="#/news"><img src="${PHOTOS.crowdFans}" alt="" loading="lazy"><span class="gallery-cap">On The Terraces</span></a>
      <a href="#/clubs"><img src="${PHOTOS.sprinklers}" alt="" loading="lazy"><span class="gallery-cap">Pitch Prep</span></a>
      <a href="#/scorers"><img src="${PHOTOS.ballClose}" alt="" loading="lazy"><span class="gallery-cap">Matchball</span></a>
    </div>
  </section>

  <section style="border-bottom:none;">
    <div class="section-head">
      <div><div class="eyebrow">LATEST</div><h2 style="margin-top:6px;">League News</h2></div>
      <a href="#/news" class="btn">All News</a>
    </div>
    <div class="news-grid">
      ${NEWS.slice(0,3).map(n=>`<div class="news-card"><div class="tag">${n.tag}</div><h3>${n.title}</h3><p>${n.body}</p></div>`).join('')}
    </div>
  </section>
  `;
}

function viewTable(){
  return `
  <section style="padding-top:44px;border-bottom:none;">
    <div class="eyebrow">${SEASON_LABEL.toUpperCase()}</div>
    <h2 style="margin-top:6px;font-size:2.1rem;">League Table</h2>
    <div class="table-scroll">
      <table class="league-table" style="margin-top:22px;">
        <caption>Full Standings — ${AS_OF_LABEL}</caption>
        <thead>
          <tr>
            <th>#</th><th>Club</th><th class="num">P</th><th class="num">W</th><th class="num">D</th><th class="num">L</th>
            <th class="num">GF</th><th class="num">GA</th><th class="num">GD</th><th class="num">Pts</th>
          </tr>
        </thead>
        <tbody>${tableRowsHtml(TABLE)}</tbody>
      </table>
    </div>
    ${tableLegend()}
  </section>
  `;
}

function viewFixtures(){
  const groups = fixturesByDate();
  return `
  <section style="padding-top:44px;border-bottom:none;">
    <div class="eyebrow">${SEASON_LABEL.toUpperCase()}</div>
    <h2 style="margin-top:6px;font-size:2.1rem;">Fixtures &amp; Results</h2>
    ${groups.map(([date, games])=>`
      <h3 style="margin-top:32px;font-size:1.1rem;color:var(--gold);">${fmtDate(date)}</h3>
      <div style="margin-top:12px;">
        ${games.map(fixtureCardHtml).join('')}
      </div>
    `).join('')}
  </section>
  `;
}

function viewClubs(){
  return `
  <section style="padding-top:44px;border-bottom:none;">
    <div class="eyebrow">THE LEAGUE</div>
    <h2 style="margin-top:6px;font-size:2.1rem;">Clubs</h2>
    <div class="club-grid" style="margin-top:26px;">
      ${CLUBS.map(c=>{
        const row = TABLE_MAP[c.id];
        return `
        <a href="#/club/${c.id}" class="club-card">
          <div class="bar" style="background:${c.color}"></div>
          <div class="pos-tag">${row.rank}${ordinalSuffix(row.rank)} Place${c.venue ? ' &middot; '+c.venue : ''}</div>
          <h3>${c.name}</h3>
          <div class="rec">${row.pts} PTS</div>
        </a>`;
      }).join('')}
    </div>
  </section>
  `;
}

function viewClubDetail(id){
  const c = CLUB_MAP[id];
  if(!c) return `<section style="padding-top:44px;"><p>Club not found.</p></section>`;
  const row = TABLE_MAP[id];
  const squad = generateSquad(id);
  const clubFixtures = FIXTURES.filter(f=>f.home===id||f.away===id);
  const clubScorers = GOLDEN_BOOT.filter(s=>s.club.id===id);

  return `
  <section style="padding-top:28px;border-bottom:none;">
    <a href="#/clubs" class="crumb">&larr; ALL CLUBS</a>
    <div class="club-banner">
      <img src="${PHOTOS.aerialStadium}" alt="" loading="lazy">
      <div class="crest-overlay">
        <div class="crest" style="background:${c.color}"></div>
      </div>
    </div>
    <div class="club-header">
      <div>
        <div class="eyebrow">${c.venue ? c.venue+' &middot; ' : ''}${row.rank}${ordinalSuffix(row.rank)} in table</div>
        <h1 style="font-size:2.2rem;margin-top:4px;">${c.name}</h1>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-box"><div class="v">${row.pts}</div><div class="l">Points</div></div>
      <div class="stat-box"><div class="v">${row.w}-${row.d}-${row.l}</div><div class="l">W-D-L</div></div>
      <div class="stat-box"><div class="v">${row.gf}:${row.ga}</div><div class="l">Goals For:Against</div></div>
      <div class="stat-box"><div class="v">${row.gd>0?'+':''}${row.gd}</div><div class="l">Goal Difference</div></div>
    </div>

    ${clubScorers.length ? `
    <h3 style="margin-top:36px;font-size:1.25rem;">On The Scoresheet</h3>
    <table class="squad" style="margin-top:14px;">
      <thead><tr><th>Player</th><th class="num">Goals</th></tr></thead>
      <tbody>${clubScorers.map(s=>`<tr><td style="font-family:'IBM Plex Sans';">${s.player.name}</td><td class="num" style="color:var(--gold);">${s.goals}</td></tr>`).join('')}</tbody>
    </table>` : ''}

    <h3 style="margin-top:36px;font-size:1.25rem;">Squad</h3>
    ${squad ? `
    <div class="table-scroll">
      <table class="squad" style="margin-top:14px;min-width:320px;">
        <thead><tr><th>#</th><th>Name</th></tr></thead>
        <tbody>${squad.map(p=>`<tr><td>${p.num}</td><td style="font-family:'IBM Plex Sans';">${p.name}</td></tr>`).join('')}</tbody>
      </table>
    </div>` : `<p style="color:var(--ivory-dim);margin-top:14px;">Squad list coming soon.</p>`}

    ${clubFixtures.length ? `
    <h3 style="margin-top:36px;font-size:1.25rem;">Fixtures</h3>
    <div style="margin-top:14px;">
      ${clubFixtures.map(f=>{
        const isHome = f.home===id;
        const opp = isHome ? f.away : f.home;
        const played = isFixturePlayed(f);
        return `
        <div class="match-card" style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;">
          <span class="mono" style="color:var(--steel);font-size:.72rem;">${fmtDate(f.date)}</span>
          <div class="match-team" style="flex:none;width:auto;">${swatch(opp)}<span>${isHome?'vs':'at'} ${CLUB_MAP[opp].name}</span></div>
          <span class="mono" style="color:${played?'var(--gold)':'var(--ivory-dim)'};">${played?'PLAYED':f.kickoff}</span>
        </div>`;
      }).join('')}
    </div>` : ''}
  </section>
  `;
}

function viewScorers(){
  return `
  <section style="padding-top:44px;border-bottom:none;">
    <div class="eyebrow">GOLDEN BOOT &middot; ${AS_OF_LABEL.toUpperCase()}</div>
    <h2 style="margin-top:6px;font-size:2.1rem;">Top Scorers</h2>
    <div class="table-scroll">
      <table class="league-table" style="margin-top:22px;min-width:420px;">
        <thead><tr><th>#</th><th>Player</th><th>Club</th><th class="num">Goals</th></tr></thead>
        <tbody>
          ${GOLDEN_BOOT.map((s,i)=>`
            <tr>
              <td class="pos">${i+1}</td>
              <td class="club-cell">${s.player.name}</td>
              <td><a href="#/club/${s.club.id}" style="display:flex;align-items:center;gap:8px;">${swatch(s.club.id)} ${s.club.name}</a></td>
              <td class="num" style="color:var(--gold);font-weight:600;">${s.goals}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </section>
  `;
}

function viewNews(){
  return `
  <section style="padding-top:44px;border-bottom:none;">
    <div class="eyebrow">LEAGUE WIRE</div>
    <h2 style="margin-top:6px;font-size:2.1rem;">News</h2>
    <div class="news-grid" style="margin-top:26px;">
      ${NEWS.map(n=>`<div class="news-card"><div class="tag">${n.tag}</div><h3>${n.title}</h3><p>${n.body}</p></div>`).join('')}
    </div>
  </section>
  `;
}

function viewGallery(){
  return `
  <section style="padding-top:44px;border-bottom:none;">
    <div class="eyebrow">AROUND THE GROUNDS</div>
    <h2 style="margin-top:6px;font-size:2.1rem;">Matchday Gallery</h2>
    <p style="color:var(--ivory-dim);max-width:60ch;margin-top:10px;">Real photos from Mtwapa Premier League matchdays — squads, kits and the pitch on gameday. Tap any photo to view it larger.</p>
    ${GALLERY_PHOTOS.length ? `
    <div class="photo-grid" style="margin-top:26px;">
      ${GALLERY_PHOTOS.map((p,i)=>`
        <button type="button" class="photo-tile" data-index="${i}">
          <img src="${p.src}" alt="${p.cap}" loading="lazy">
        </button>`).join('')}
    </div>` : `<p style="color:var(--ivory-dim);margin-top:26px;">No photos yet — check back after the next matchday.</p>`}
  </section>

  <div class="lightbox" id="lightbox">
    <button type="button" class="lightbox-close" id="lightboxClose" aria-label="Close">&times;</button>
    <button type="button" class="lightbox-nav prev" id="lightboxPrev" aria-label="Previous">&#8249;</button>
    <img src="" alt="" id="lightboxImg">
    <button type="button" class="lightbox-nav next" id="lightboxNext" aria-label="Next">&#8250;</button>
  </div>
  `;
}

function viewPredictor(){
  const upcoming = FIXTURES.filter(f=>!isFixturePlayed(f)).slice(0,10);
  return `
  <section style="padding-top:44px;border-bottom:none;">
    <div class="eyebrow">FAN PREDICTOR</div>
    <h2 style="margin-top:6px;font-size:2.1rem;">Predict The Results</h2>
    <p style="color:var(--ivory-dim);max-width:60ch;margin-top:10px;">Pick a winner for each upcoming fixture. Your picks and the tallies below are saved in this browser's local storage.</p>
    <div id="pickList" style="margin-top:26px;" data-fixture-ids="${upcoming.map(f=>f.id).join(',')}">Loading predictions…</div>
  </section>
  `;
}
