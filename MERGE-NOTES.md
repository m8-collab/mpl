# Merge notes — goal-ace-manager + MPL

This project is the result of merging two builds of the same site
(**Mtwapa Premier League**) into one:

- **Base / kept as-is**: the `goal-ace-manager` React + TanStack Start app —
  its routing, page layouts, and shadcn/ui-based visual design are unchanged.
- **Ported in**: MPL's real, live data and its admin panel.

## What changed

1. **`.env`** now points at MPL's Supabase project
   (`mtrffikgpwsigugjbnbx.supabase.co`) instead of the empty project this
   app shipped with. That project already has:
   - the real Season 2026 clubs, table, fixtures, scorers, squads, news and
     gallery photos (same table schema both apps already shared), and
   - the existing approved admin login(s) and the admin-approval system.

   Nothing needed to be re-seeded — connecting to the right database was
   the whole job. If you'd rather keep a separate database, the original
   `.env` values are noted inline in the file, and the SQL to set one up
   from scratch is under `supabase-mpl-reference/` (run `schema.sql`, then
   `seed_data.sql`, then the rest of the files in that folder in any order).

2. **New `/admin` route** (`src/routes/admin.tsx` +
   `src/components/admin/EntityManager.tsx` +
   `src/components/admin/UploadManagers.tsx`), rebuilt in React/shadcn to
   match this app's design, replacing MPL's separate `admin.html`. It
   covers the same ground as the original:
   - Login, self-registration, forgot/reset password
   - Pending-approval screen for new registrations
   - Tabs: **Clubs, Table, Fixtures, Scorers, Squads (with photo upload),
     News, Gallery (albums + photo upload), Settings, Admins**
     (approve/revoke other admins)

   A small **Admin** link was added to the site footer, same as MPL's.

3. `supabase/config.toml` project ref updated to match; the app's original
   Supabase migrations (`supabase/migrations/`) are left in place for
   reference but aren't needed against the MPL project, which already has
   an equivalent schema and RLS policies applied.

## Club crests & player photos

MPL's crest/headshot images are now bundled at `public/assets/crests/` and
`public/assets/players/` (same files, same folder layout as the static
site's `assets/`). `ClubBadge.tsx` and the squad list on each club page
already read `club.crest_url` / `player.photo_url` from the database and
render them as `<img>` — no component changes were needed.

Two things had to change on the data side, though, because the old site
was a hash-router (`#/clubs/x`) where root-relative paths always resolved
correctly, and this app uses real routes:

- `squads.photo_url` values in the live DB are stored without a leading
  `/` (e.g. `assets/players/ama4/000.jpg`), which breaks once you're on a
  real route like `/clubs/ama4`.
- `clubs.crest_url` was never populated at all — the static site kept crest
  paths in a client-side JS lookup table instead of the database.

Run `supabase-mpl-reference/fix-asset-paths-for-react.sql` once against
the same Supabase project to fix both (adds the leading slash to existing
squad photos, and sets `crest_url = '/assets/crests/<id>.jpg'` for all 31
clubs that have a crest file). After that, crests and headshots should
just appear — nothing else to deploy or configure.

## Running it

```sh
npm i
npm run dev
```

The site should come up already showing the real table/fixtures/clubs, and
`/admin` should log in with the same credentials used on the live MPL site.

## Merge of MPL-integrated-2.zip (18 Aug)

This zip's src/ (PWA support, updated standings, UI polish, updated club
pages) was used as the base, since it was the most recent snapshot. The
match-official role separation (`src/routes/officials.tsx`, the redirect
logic in `src/routes/admin.tsx`, and
`supabase-mpl-reference/restrict-match-official-role.sql`) from the
previous round was layered back on top, since this zip's snapshot
predated that work and didn't include it.

Also re-applied two column fixes that this zip's SQL reference copies had
reverted to their original (broken) state — `fixtures.home_score` /
`away_score` in `handwritten-rules-update.sql`, and `clubs.crest_url` in
`fix-asset-paths-for-react.sql`. Both already exist on the live database
from when they were fixed previously, so this only matters if these files
are ever run again from scratch.

## PDF import for fixtures and scorers (18 Aug)

New: `src/lib/pdf-import.ts` (text extraction via pdfjs-dist + heuristic
parsers) and `src/components/admin/PdfImportManagers.tsx` (upload +
editable review table + bulk save), wired into the Fixtures and Scorers
tabs in `/admin`.

Since fixture/scorer PDF formats vary by source, extraction is
best-effort — dates, times, and club names are matched heuristically
(known club names/ids only, no free-text guessing), and nothing gets
written to the database until you review and confirm each row in the
table. Rows missing a required field are highlighted so they're easy to
spot before saving.

Known limitation: this only reads text-based PDFs (a typed list, a table
exported to PDF). A scanned/photographed page has no text layer and will
come back empty — there's no OCR step here.

Requires `pdfjs-dist` (added to package.json) — run `npm i` after pulling
this so the new dependency actually installs.

## Mobile fit + new app icon (18 Aug)

**Icons:** replaced the placeholder heart icon (default from the PWA
scaffolding, unrelated to this site) with a real MPL icon — the same
accent gradient and "MPL" wordmark already used in the header badge,
generated at every required size: `icon-192.png`, `icon-512.png`,
`icon-512-maskable.png` (kept within the safe zone so Android's circular/
squircle mask doesn't crop it), `apple-touch-icon.png`, and a proper
multi-size `favicon.ico`. No code changes needed — `manifest.webmanifest`
and the `<head>` links already pointed at these filenames.

**Header:** was cramped on narrow phones — the brand title, "Get the
app" button, and hamburger button could crowd the top row. Fixed by:
shrinking the brand badge/text on small screens, truncating the title
instead of letting it force horizontal scroll, hiding the season label
under the title on mobile (redundant with page content), and moving
"Get the app" out of the cramped top row into the mobile nav dropdown
(full-width button) rather than fighting for space next to the hamburger.

**Footer:** the right-hand column was still `text-right` after
collapsing to a single column on mobile, which looked misaligned —
now left-aligned below `lg`.

**PWA safe areas:** added `viewport-fit=cover` and
`env(safe-area-inset-top/bottom)` padding to the header and footer, so
content doesn't sit under the notch or home-indicator bar when running
as an installed standalone app on iOS.

## Real club crest as the app icon (19 Aug)

Replaced the generated "MPL" wordmark icon with your actual club crest
(cropped from the uploaded banner — the circular badge on the left,
padded to a square with its own navy background rather than stretched or
cropped into a circle). Same files updated in place: `icon-192.png`,
`icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`,
`favicon.ico`.

Source image was 813×259 (a banner, not a dedicated icon file), so the
crest itself came in around 259×259 before upscaling — it holds up fine
through 192px, but at 32px (browser tab favicon) the text becomes
illegible and it reads as a colored blob, same as most detailed crests
do at that size. If you get a cleaner/higher-res version of just the
crest (no banner/text around it) at some point, swap it in for a
sharper result, especially at small sizes.

## Sidebar dashboard redesign (19 Aug)

Recreated /admin and /officials in the CoachPro-style layout you shared
(rounded glass cards, icon sidebar, greeting header, stat cards) instead
of the old top-tab layout. New shared shell:
`src/components/admin/DashboardShell.tsx` (`DashboardShell`, `StatCard`,
`DashCard`), plus a `dash-shell` background utility in `styles.css`.

The two portals share the same visual language on purpose, but are
styled with different accents (admin = the site's pink/purple accent
gradient; officials = mint) and different brand labels in the sidebar
("MPL Admin" vs "Match Officials"), plus each has its own Dashboard
overview page — admin's shows total clubs/matches played/leading
scorer/table leader plus a standings preview; officials' shows fixtures
still needing a report plus the next one due. This is on top of the
role-based access split from before (still enforced by
`restrict-match-official-role.sql`) — the redesign is cosmetic
separation, the RLS policies are the real separation.

All the existing admin functionality (EntityManager sections, PDF
import, squads/gallery upload, settings, admin approval) is unchanged —
only the navigation chrome around it changed, from tabs to a sidebar
with a section-switching Dashboard state.

## Match Official removed from /admin entirely (19 Aug)

The "Match Official" sidebar item and its filing tool are gone from
/admin — full admins can no longer file match reports from inside the
admin dashboard. That functionality now only exists at /officials.

To satisfy "admin can see all match officials": the Admins section in
/admin now shows two separate cards — "Admin accounts" and "Match
officials" — pulled apart by the `role` column instead of one mixed
list. Admins can still approve/revoke either kind of account from here,
but the actual report-filing UI stays exclusively on the officials
portal, matching the DB-level separation from
`restrict-match-official-role.sql`.

## Admin-created match official logins + PWA install on both dashboards (19 Aug)

**Install the app from either dashboard:** the same "Get the app" button
from the public site header is now in the DashboardShell header too
(desktop) and above the mobile nav (phone) — since it's all one PWA,
installing from `/officials` or `/admin` installs the exact same app
onto the home screen.

**Admin can create ready-to-use match official logins:**
new "Create a match official login" form at the top of the Match
officials card in `/admin` → Admins. Admin sets (or generates) an
email + password, and the account is created *already approved* — no
self-registration or approval step. The official can sign in at
`/officials` immediately with those credentials.

This required a new Supabase Edge Function —
`supabase/functions/create-match-official/index.ts` — because creating
another person's login can't be done safely from the browser (it needs
the service-role key, which must never reach client-side code). The
function verifies the caller is a real, approved, full admin using
their own session first, and only then uses the service role to create
the account and auto-approve it.

**Deploy the edge function once** (needed before the "Create account"
button in /admin will work):
```
supabase login
supabase link --project-ref mtrffikgpwsigugjbnbx
supabase functions deploy create-match-official
```
No manual secrets to set — `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase into
every edge function's environment.

## Postponed matches, player position, Scoreboard rename, team-grouped squads, foul reasons (20 Aug)

**Postponed matches**: `fixtures.postponed` / `postponed_note` (new columns
— run `supabase-mpl-reference/postponed-position-foul-reason.sql`).
Match officials get a clear "This match was postponed" toggle on the
report form (clears/disables the score fields, captures a reason).
Admins can do the same from the Fixtures tab. The public site shows a
"Postponed" badge and the reason instead of a score — postponed matches
were already excluded from standings (no score set), this just makes
the reason visible instead of the match looking simply unplayed.

**Player position replaces jersey number**: `squads.position` (new
column, same migration file above). Jersey number is gone from the
admin form, the public squad list, and the player profile — replaced
with Goalkeeper / Defender / Midfielder / Forward.

**Scorers → Scoreboard**: route renamed `/scorers` → `/scoreboard`
(file, routeTree.gen.ts, nav, footer, homepage links, admin sidebar all
updated). The underlying `scorers` database table name is unchanged —
only user-facing labels and the URL changed.

**Squads grouped by team**: admin's Squads tab is now a collapsible
section per club (an actual team sheet) instead of one long flat table,
plus an "Unattached" section for anything missing a club.

**Foul reasons on cards**: `cards.foul_reason` (same migration file).
When a match official logs a card, they pick what actually happened
(reckless tackle, dissent, handball, etc., or free text for anything
else) — shown alongside the card in both the official's own card list
for that match and the admin Discipline tab.

**One SQL file to run**: `supabase-mpl-reference/postponed-position-foul-reason.sql`
covers all three schema changes in this round.

## Live match center, predictor leaderboard, head-to-head, multi-season, official assignment, WhatsApp share, sponsor visibility (27 Aug)

One SQL file covers all the new schema: `supabase-mpl-reference/seasons-live-assignment-predictor.sql`.

**Live match center**: `fixtures.live` (new column). A match official
gets a "Go live at kickoff" / "End live match" button on the report card
(separate from the postponed toggle). While a fixture is live, the
public site polls every 15s (only while something is actually live —
otherwise it's the normal 60s staleTime, no extra load) and shows a
pulsing LIVE badge on the match card instead of the kickoff time.

**Predictor leaderboard**: new `predictions` table (RLS: anyone can
insert/read, no update/delete — picks are locked in once made, like a
real bet slip; one pick per fixture per phone number, enforced by a
unique constraint). The old version only saved picks to each visitor's
own browser with no leaderboard — this replaces that with real
submissions and a public leaderboard ranked by correct picks once
matches are played.

**Head-to-head record**: no schema change — computed client-side from
existing fixtures data. Shows on each club's profile page as a
per-opponent W-D-L/goals record. Naturally gets richer once multiple
seasons of fixtures exist.

**Multi-season tagging**: `season` column added to `fixtures` and
`scorers` (existing rows backfilled to the current season label so
nothing goes "seasonless"). Public Fixtures and Scoreboard pages get a
season dropdown (only appears once more than one season exists in the
data). **Important scope limit**: `table_rows` (the league table) is
NOT season-tagged — it's keyed by `club_id` alone, so it can only ever
hold one live standings row per club. Making the table itself
historical would need a real primary-key change (`club_id` →
`club_id + season`), which is riskier and wasn't done here. The
practical effect: fixtures and top-scorer history will be browsable by
season, but the league table itself always reflects "right now."

**Referee/official assignment**: `fixtures.assigned_official_id` (new
column, references the official's auth user id). Admins can assign an
approved match official to a fixture from the Fixtures tab (dropdown
pulled live from approved `match_official` accounts). Officials aren't
hard-blocked from other fixtures — assigned ones are just surfaced
first on their Dashboard overview ("Assigned to you" stat + "Your next
assigned fixture" card).

**WhatsApp result sharing**: no schema change. "Share result on
WhatsApp" button next to Save on the match report form — builds a
formatted result message (score, venue, date, MOTM, cards, official)
from data already on the page and opens `wa.me` with it pre-filled for
the official to send to whatever group they choose. This is manual
sharing (a share-intent link), not an automated broadcast — a fully
automated WhatsApp Business API/Twilio integration needs a paid
account and phone number verification that can't be set up sight
unseen, so this is the honest, immediately-usable version of that idea.

**Sponsor visibility**: sponsors were already rendering in the footer;
added a second, more visible "Proudly supported by" strip right under
the homepage hero, since footer placement is easy to scroll past
without noticing.

## MatchCom rename, safe auto-updating table, fixture detail page with eligibility check (28 Aug)

**Match Officials → MatchCom**: route renamed `/officials` → `/matchcom`
(file, routeTree.gen.ts, and every visible label/link/page title updated
to match). The database role value (`role = 'match_official'`) is
unchanged on purpose — only the portal's name and URL changed, not the
underlying account type.

**Table now updates automatically after every result — safely this
time**: new file `supabase-mpl-reference/safe-auto-table-update.sql`.
Earlier in this project, an auto-recalculate trigger was tried and then
turned off because it worked by wiping and rebuilding the whole table
from every fixture's score — which blanked out real standings, since
most historical matches were never entered with individual scores. This
version is fundamentally different: it only applies the delta for the
ONE fixture that changed (new result, corrected result, or a result
removed/postponed), leaving every other club's row and whatever
baseline is already there completely untouched. Whatever the table
shows right now becomes the correct starting point — only new results
from here on change anything. Safe to run even with real data in place.

**Fixture detail page ("Match Centre")**: new route
`/fixtures/$fixtureId`, reached via a "Match centre & squads →" link on
every match card. Shows the match header (score/status/venue/postponed
note), cards recorded, match official & MOTM if filed, and both teams'
full squads side by side. Any player carrying an active disciplinary
ban (5 yellow cards or a red card this season — the same rule the
public Discipline page already uses) is flagged **Suspended** in their
squad list.

**Important honesty note on the suspension flag**: it reflects each
player's *total season discipline record*, not a match-by-match ban
countdown. There's no data model tracking which specific matches a
suspension has already been served against (that would need per-fixture
squad/appearance tracking, which doesn't exist yet — see the recommendation
below). So a player will keep showing as Suspended for the rest of the
season once they cross the threshold, even after they've actually served
their 1 or 3 matches. Treat it as a strong heads-up to double-check, not
an infallible auto-block.

## All 5 recommendations: real appearance tracking, squad PDF import, match photos, configurable discipline rules, contact form (28 Aug)

One SQL file: `supabase-mpl-reference/appearances-photos-discipline-config-inquiries.sql`.

**Real appearance tracking (fixes the suspension-countdown gap)**: new
`appearances` table. The match official's report form now has a full
lineup picker for both squads — mark each player Starting XI or
Substitute, with sub-on/off minute fields, instead of the old free-text
lineup boxes (which are left in place, unused, so no data was lost).
Selecting a suspended player warns the official first (with the ban
reason and matches remaining) but doesn't block it — matching what you
asked for. A ban now counts as "served" match-by-match based on real
appearance records, not just a season-long flag: `computeSuspensions()`
in `league.ts` walks a player's fixtures since their ban started and
only counts a match as served if they have no appearance in it. The
Match Centre page and the lineup picker both now show live "X match(es)
remaining" instead of a blanket Suspended tag.

**Squad PDF import**: same pattern as the fixtures/scorers importers —
upload a team-sheet PDF, review the extracted player/position/club
matches in an editable table, then save. Handles either a single club's
roster (pick a default club) or a multi-club document (each section
starts with a line matching a club's name).

**Match photos linked to a fixture**: this already existed via the
match official's own photo upload (auto-creates/reuses an album tied to
that fixture) — the missing piece was just the `albums.fixture_id`
column backing it, now added. The Match Centre page shows a "Photos
from this match" section once any exist.

**Admin-configurable discipline rules**: the yellow-card threshold and
ban lengths (previously hardcoded: 5 yellows → 1 match, any red → 3
matches) are now in Settings → Discipline rules. Changes apply
immediately everywhere that reads discipline data (public Discipline
page, Match Centre suspension flags, the lineup picker's warning) —
there's no separate publish step.

**Contact / inquiry form**: new `inquiries` table. Every club page has
a "Contact {club}" form (name, phone, message) in the sidebar. Submissions
are admin-only — RLS blocks anyone else from reading them, and they're
deliberately NOT part of the public league data fetch. New "Inquiries"
tab in `/admin` lists them with a read/unread toggle and an unread-count
badge.

## Fixed edit-scroll navigation, removed public Admin footer link (30 Aug)

**Editing now actually jumps to the form**: `EntityManager`'s "Edit"
button (used by Clubs, Table, Fixtures, Scoreboard, News, Sponsors — any
generic admin list) had a real bug: it called
`window.scrollTo({ top: window.scrollY })`, which scrolls to wherever
you already are — a no-op. Clicking Edit did nothing visible, especially
on mobile where the form sits above a long list. Fixed to actually
scroll the form into view. Squads' own edit button had the same gap
(no scroll call at all) and got the same fix.

**Admin link removed from the public footer**: the small "Admin" link
that sat next to the "as of" label is gone. `/admin` and `/matchcom`
still work exactly the same if you type the URL directly — this just
stops advertising the entry point to every visitor.
