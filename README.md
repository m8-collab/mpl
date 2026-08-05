# Mtwapa Premier League

The official site for the Mtwapa Premier League — Season 2026, 5th Edition.
Real clubs (31 in the current table), the real points table, the real
Golden Boot / top-scorers list, real August fixtures, and squads for the
clubs whose team sheets have been digitized so far.

Pure static HTML/CSS/JS. No build step, no framework, no server required.

## Project structure

```
.
├── index.html          Page shell, nav, ticker, footer
├── css/
│   └── style.css       Full design system (colors, type, layout, responsive rules)
├── js/
│   ├── data.js           REAL LEAGUE DATA lives here — see below
│   ├── views.js           View/render functions for every page
│   └── main.js            Router, ticker, predictor storage, app init
├── package.json
├── netlify.toml         Netlify deploy config
├── vercel.json           Vercel deploy config
└── .gitignore
```

## Updating the league data (do this every matchday)

Everything real lives in `js/data.js`, in three arrays you edit directly:

- **`TABLE_RAW`** — one row per club: `[id, played, won, drawn, lost, goalsFor, goalsAgainst]`.
  Points and goal difference are calculated automatically from these numbers.
  Row order = table order (already ranked).
- **`GOLDEN_BOOT_RAW`** — one row per scorer: `['Player Name', 'club-id', goals]`.
- **`FIXTURES_RAW`** — one row per match: `[matchNo, 'YYYY-MM-DD', 'home-id', 'away-id', 'venue', 'kickoff']`.
  The site automatically marks a fixture "PLAYED" once its date is in the
  past (compared to the real calendar date), and "UPCOMING" otherwise —
  no manual flag needed.
- **`CLUBS_RAW`** — club id, display name, and (optional) home venue.
- **`SQUADS_RAW`** — real rosters, keyed by club id. Only clubs with a
  digitized team sheet appear here; every other club's page will show
  "Squad list coming soon" rather than invented names. Add a new
  `clubId: ['Player One', 'Player Two', ...]` entry as more team sheets
  come in.

Because `TABLE`, `GOLDEN_BOOT`, `FIXTURES`, and every view derive from
these raw arrays, editing them is the only step needed — `views.js` and
`main.js` never need to change for a normal data update.

### Adding a brand-new club mid-season
Add one entry to `CLUBS_RAW` and one row to `TABLE_RAW`. That's it —
the club will appear in Table, Clubs, and (once it has fixtures/scorers)
everywhere else automatically.

## Run it locally

```bash
npx serve .
# or
python3 -m http.server 5173
```

## Deploy it

Static site — deploys anywhere that serves static files.

**Netlify** — drag-and-drop the project folder onto https://app.netlify.com/drop,
or `npx netlify-cli deploy --prod`. `netlify.toml` is already configured.

**Vercel** — `npx vercel --prod` from inside the project folder.
`vercel.json` is already configured.

**GitHub Pages** — push to a repo, enable Pages on `main` (root). No
config needed; the app uses hash-based routing (`#/table`, `#/club/komboa`,
etc.) so it works on any static host without extra rewrite rules.

## About the fan predictor & shared data

The Predictor page saves picks to `localStorage`:

- **Your picks** persist for you, in your browser, across visits.
- **The "% of picks" tallies** only reflect picks made in that same
  browser — there's no server, so counts are not shared across visitors
  until you wire up a real backend.

To make tallies genuinely shared across every visitor, replace the two
methods on the `storage` object at the top of `js/main.js` with calls to
a real backend — Supabase, Firebase Realtime Database, or a small
serverless function backed by a key-value store (Upstash Redis, etc.)
all work well for this. Nothing else in the app needs to change.

## Data provenance & accuracy

Table, fixtures, and scorer numbers were transcribed from Mtwapa Premier
League–published graphics as at August 2026. If you spot a
transcription error, correct the relevant row in `TABLE_RAW` /
`GOLDEN_BOOT_RAW` / `FIXTURES_RAW` in `js/data.js` — there's no other
copy of the data anywhere in the app to keep in sync.

Photography used on the Home page (stadium/pitch/crowd imagery) is
free-to-use stock photography (Pexels) and is generic — it is not
footage of actual Mtwapa Premier League matches.

