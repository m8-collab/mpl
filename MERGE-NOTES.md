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
