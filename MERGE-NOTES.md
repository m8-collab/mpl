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
