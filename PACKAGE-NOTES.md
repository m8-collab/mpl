# Mtwapa Premier League — Full-Stack Package

This is the complete site, wired end-to-end to your Supabase project —
every feature on the home page, plus every other page it links to.

## Public site (`index.html` + `css/style.css` + `js/`)
Single-page app, hash-routed, all pulling live from Supabase:
- **Home** — hero with top-6 table snippet, scrolling results ticker,
  Golden Boot podium, next fixtures, matchday gallery preview, latest news
- **Table** — full standings with UCL/relegation zone highlighting
- **Fixtures** — all matches grouped by date
- **Clubs** — full club grid + individual club pages (record, squad,
  scoresheet, fixture list)
- **Scorers** — full Golden Boot rankings
- **News** — all articles
- **Gallery** — photo albums with a keyboard-navigable lightbox
- **About** — CBO info, objectives, contact details
- **Predictor** — pick winners for upcoming fixtures; picks and community
  tallies are saved to each visitor's browser

It also **live-updates for every visitor** the moment anything changes in
Supabase (`subscribeLiveUpdates` in `js/main.js`) — no refresh needed.

## Admin (`admin.html` + `js/admin.js` + `css/admin.css`)
Manage clubs, table rows, fixtures, scorers, squads, news, and gallery/
albums without touching the database directly. Setup steps are in
`ADMIN-SETUP.md`.

## Backend (`supabase/`)
- `schema.sql` — run first, sets up all tables + RLS policies
- `seed_data.sql` — your real season data (clubs, table, fixtures,
  scorers, news)
- `gallery-albums.sql` — adds album support to the gallery
- `admin-approval-system.sql`, `fix-admin-rls-recursion.sql` — admin
  access-control migrations
- `seed-photos/` — sample matchday images referenced by the seed data

## Deploying
`netlify.toml` and `vercel.json` are both included — push this folder to
either platform and it should deploy as-is (static site, no build step).
Full details are in `README.md`.

## Credentials
`js/supabase-client.js` already has your live project URL and anon key —
this is the same public, RLS-protected key your site currently uses, safe
to ship in the client bundle.
