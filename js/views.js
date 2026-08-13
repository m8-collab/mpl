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
function swatch(id){
  const club = CLUB_MAP[id];
  if(!club) return '';
  if(club.crest) return `<span class="swatch swatch-crest"><img src="${club.crest}" alt="${esc(club.name)} crest" loading="lazy"></span>`;
  const initials = club.name.split(/\s+/).filter(w=>w.length).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  return `<span class="swatch" style="background:${club.color}">${initials}</span>`;
}
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

function newsCardHtml(n){
  return `
  <div class="news-card">
    <div class="news-band">${n.tag ? esc(n.tag) : 'NEWS'}</div>
    <div class="news-body">
      <h3>${esc(n.title)}</h3>
      <p>${esc(n.body)}</p>
    </div>
  </div>`;
}

function fixtureCardHtml(f){
  const played = isFixturePlayed(f);
  return `
  <div class="match-card">
    <div class="match-card-head">
      <span>&#128197; ${fmtDate(f.date)}${f.kickoff ? ' &middot; ' + f.kickoff : ''}</span>
      <span>${f.venue ? f.venue.toUpperCase() : ''}</span>
    </div>
    <div class="match-row">
      <div class="match-team">${swatch(f.home)}<span>${CLUB_MAP[f.home].name}</span></div>
      <span class="match-vs">${played ? 'FT' : 'V'}</span>
      <div class="match-team" style="justify-content:flex-end;text-align:right;"><span>${CLUB_MAP[f.away].name}</span>${swatch(f.away)}</div>
    </div>
    <div class="match-status">MATCH #${f.matchNo} &middot; ${played ? 'PLAYED' : 'UPCOMING'}</div>
  </div>`;
}

function podiumHtml(top){
  if(!top.length) return `<p style="color:var(--ivory-dim);">No scorers on record yet.</p>`;
  const initials = s => s.player.name.split(/\s+/).filter(w=>w.length).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const order = [1,0,2].filter(i=>top[i]); // silver, gold (center), bronze
  return `
  <div class="podium">
    ${order.map(i=>{
      const s = top[i];
      const rank = i+1;
      const cls = rank===1?'first':rank===2?'second':'third';
      return `
      <div class="podium-item ${cls}">
        ${rank===1?'<div class="podium-crown">&#128081;</div>':''}
        <div class="podium-avatar" style="background:${s.club.color}">${initials(s)}<span class="podium-rank">${rank}</span></div>
        <div class="podium-name">${s.player.name}</div>
        <div class="podium-club">${s.club.name}</div>
        <div class="podium-goals">${s.goals}</div>
        <div class="podium-label">Goals</div>
      </div>`;
    }).join('')}
  </div>
  <div style="text-align:center;margin-top:8px;">
    <a href="#/scorers" class="btn">Full Rankings</a>
  </div>
  `;
}

/* ===================== VIEWS ===================== */
function viewHome(){
  const top6 = TABLE.slice(0,6);
  const upcoming = FIXTURES.filter(f=>!isFixturePlayed(f)).slice(0,6);
  const recentPlayed = FIXTURES.filter(f=>isFixturePlayed(f)).slice(-6);
  const top3Scorers = GOLDEN_BOOT.slice(0,5);

  return `
  <section class="hero pitch-lines">
    <div class="eyebrow">${SEASON_LABEL.toUpperCase()} — MTWAPA PREMIER LEAGUE</div>
    <div class="hero-grid" style="margin-top:16px;">
      <div>
        <div class="stat-strip">${CLUBS.length} CLUBS &nbsp;&middot;&nbsp; ${FIXTURES.length} FIXTURES &nbsp;&middot;&nbsp; 1 CHAMPION</div>
        <h1>ONE TABLE.<br><em>${CLUBS.length} CLUBS.</em></h1>
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
    <div class="eyebrow">TOP PERFORMERS</div>
    <h2 style="margin-top:6px;">Player Stats</h2>
    ${podiumHtml(top3Scorers)}
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
      ${NEWS.slice(0,3).map(newsCardHtml).join('')}
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
          <div class="club-card-head">${swatch(c.id)}<h3>${c.name}</h3></div>
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
        ${c.crest ? `<img class="crest" src="${c.crest}" alt="${esc(c.name)} crest">` : `<div class="crest" style="background:${c.color}"></div>`}
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
      <tbody>${clubScorers.map(s=>`<tr><td style="font-family:'Poppins';">${s.player.name}</td><td class="num" style="color:var(--gold);">${s.goals}</td></tr>`).join('')}</tbody>
    </table>` : ''}

    <h3 style="margin-top:36px;font-size:1.25rem;">Squad</h3>
    ${squad ? `
    <div class="squad-grid">
      ${squad.map(p=>`
        <div class="squad-card">
          ${p.photo
            ? `<img class="squad-photo" src="${p.photo}" alt="${esc(p.name)}" loading="lazy">`
            : `<div class="squad-photo squad-photo-fallback">${esc((p.name||'').split(/\s+/).filter(w=>w.length).slice(0,2).map(w=>w[0]).join('').toUpperCase())}</div>`}
          <div class="squad-name">${esc(p.name)}</div>
          ${p.num ? `<div class="squad-num">#${p.num}</div>` : ''}
        </div>`).join('')}
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
      ${NEWS.map(newsCardHtml).join('')}
    </div>
  </section>
  `;
}

function viewGallery(){
  return `
  <section style="padding-top:44px;border-bottom:none;">
    <div class="eyebrow">AROUND THE GROUNDS</div>
    <h2 style="margin-top:6px;font-size:2.1rem;">Matchday Gallery</h2>
    <p style="color:var(--ivory-dim);max-width:60ch;margin-top:10px;">Photos grouped by event and matchday. Open a folder to browse.</p>
    ${ALBUMS.length ? `
    <div class="album-grid" style="margin-top:26px;">
      ${ALBUMS.map(a=>`
        <a href="#/gallery/${a.id}" class="album-tile">
          <div class="album-cover" style="${a.cover ? `background-image:url('${a.cover}')` : ''}">
            <span class="album-folder-icon">&#128193;</span>
          </div>
          <div class="album-meta">
            <div class="album-name">${esc(a.name)}</div>
            <div class="album-count">${a.count} photo${a.count===1?'':'s'}</div>
          </div>
        </a>`).join('')}
    </div>` : `<p style="color:var(--ivory-dim);margin-top:26px;">No photo albums yet — check back after the next matchday.</p>`}
  </section>
  `;
}

function viewGalleryAlbum(albumId){
  const album = ALBUMS.find(a=>String(a.id)===String(albumId));
  const photos = PHOTOS_BY_ALBUM[albumId] || [];
  // used by initGallery() for the lightbox — keep it scoped to this album
  window.__currentAlbumPhotos = photos;

  return `
  <section style="padding-top:44px;border-bottom:none;">
    <a href="#/gallery" class="album-back">&#8249; All Albums</a>
    <div class="eyebrow" style="margin-top:18px;">AROUND THE GROUNDS</div>
    <h2 style="margin-top:6px;font-size:2.1rem;">${esc(album ? album.name : 'Album')}</h2>
    ${album && album.description ? `<p style="color:var(--ivory-dim);max-width:60ch;margin-top:10px;">${esc(album.description)}</p>` : ''}
    ${photos.length ? `
    <div class="photo-grid" style="margin-top:26px;">
      ${photos.map((p,i)=>`
        <button type="button" class="photo-tile" data-index="${i}">
          <img src="${p.src}" alt="${esc(p.cap)}" loading="lazy">
        </button>`).join('')}
    </div>` : `<p style="color:var(--ivory-dim);margin-top:26px;">No photos in this album yet.</p>`}
  </section>

  <div class="lightbox" id="lightbox">
    <button type="button" class="lightbox-close" id="lightboxClose" aria-label="Close">&times;</button>
    <button type="button" class="lightbox-nav prev" id="lightboxPrev" aria-label="Previous">&#8249;</button>
    <img src="" alt="" id="lightboxImg">
    <button type="button" class="lightbox-nav next" id="lightboxNext" aria-label="Next">&#8250;</button>
  </div>
  `;
}

function viewAbout(){
  return `
  <section style="padding-top:44px;">
    <div class="eyebrow">WHO WE ARE</div>
    <h2 style="margin-top:6px;font-size:2.1rem;">Mtwapa Premier CBO</h2>
    <p style="color:var(--ivory-dim);max-width:70ch;margin-top:14px;line-height:1.7;">
      A group of community development in sports, talents, arts, health, education,
      clean environment and economic and social transformation for a sustainable
      future development, hereby formed on 16th April 2026.
    </p>

    <h3 style="margin-top:36px;font-size:1.3rem;color:var(--gold);">Purpose of the Group</h3>
    <p style="color:var(--ivory-dim);max-width:70ch;margin-top:10px;line-height:1.7;">
      To organize and promote sporting activities among sportsmen and the community
      at large. Becoming a cornerstone in establishing sports talent events,
      academies and stadiums for the purpose of running sporting activities.
      Attaining sporting resources to implement sports tournaments, local leagues,
      awards and rewarding.
    </p>

    <h3 style="margin-top:36px;font-size:1.3rem;color:var(--gold);">Objectives</h3>
    <ul style="color:var(--ivory-dim);max-width:70ch;margin-top:10px;line-height:1.9;padding-left:20px;">
      <li>To promote unity and inter-personal relationship between members.</li>
      <li>To promote talents in sports.</li>
      <li>To venture into sporting activities through organizing sports activities and competitions so as to promote youth talents.</li>
      <li>Provide a chance for youth to achieve educational goals through sourcing and providing educational incentives through scholarships, and sourcing support for the same.</li>
      <li>Provide sports scholarships to talented youth by negotiating with educational institutions, local leaders, non-governmental organizations and well-wishers.</li>
      <li>Offer support to groups and youth in developing film and music projects.</li>
      <li>Organize competitions and awards among sporting clubs.</li>
      <li>Organize football, bicycle race, swimming and other sports competitions with the aim of promoting, rewarding, exposing and sourcing financial and resource assistance.</li>
      <li>Collaborate with business stakeholders, community leaders and NGOs in sourcing support for implementation of sports and talent avenues.</li>
      <li>Develop sports as an economic sustainability avenue for members and the community at large.</li>
      <li>Inform and raise community awareness on matters of health, environment and economic development through sports and related talent activities.</li>
      <li>Enhance oneness, sense of belonging, integrity and respect to the law and to one another.</li>
      <li>Initiate socio-economic activities for the benefit of members and the community, including education scholarships for needy, bright, orphaned and talented youth.</li>
      <li>Encourage income-generating investment projects.</li>
      <li>Plan properly, and develop effective and efficient monitoring and evaluation mechanisms across all activities and projects.</li>
      <li>Encourage members to interact with each other, sharing experiences and challenges in life.</li>
      <li>Provide financial support to members to help establish income-generating projects.</li>
      <li>Provide a sporting chance to the community through programmes such as the Mtwapa Premier soccer initiative, Copsa Talents for School, athletics and bicycle race competitions.</li>
    </ul>

    <h3 style="margin-top:36px;font-size:1.3rem;color:var(--gold);">Contact & Address</h3>
    <div class="about-contact-grid">
      <div>
        <div class="mono" style="color:var(--steel);font-size:.68rem;letter-spacing:.08em;">OFFICE</div>
        <p style="margin-top:6px;color:var(--ivory-dim);line-height:1.6;">
          Starlight Building, Mtwapa Luxury Road, Mtaani–Maweni,<br>
          Mtwapa location, Shimo la Tewa Ward,<br>
          Kilifi South Sub-County, Kilifi County
        </p>
      </div>
      <div>
        <div class="mono" style="color:var(--steel);font-size:.68rem;letter-spacing:.08em;">POSTAL ADDRESS</div>
        <p style="margin-top:6px;color:var(--ivory-dim);">P.O. Box 726-80109, Mtwapa</p>
        <div class="mono" style="color:var(--steel);font-size:.68rem;letter-spacing:.08em;margin-top:16px;">EMAIL</div>
        <p style="margin-top:6px;color:var(--ivory-dim);"><a href="mailto:mtwapapremier26@gmail.com" style="color:var(--gold);">mtwapapremier26@gmail.com</a></p>
        <div class="mono" style="color:var(--steel);font-size:.68rem;letter-spacing:.08em;margin-top:16px;">TELEPHONE</div>
        <p style="margin-top:6px;color:var(--ivory-dim);">0799 669040 &middot; 0711 413416 &middot; 0722 370130</p>
      </div>
    </div>
  </section>
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
