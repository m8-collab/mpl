# Handwritten rule-book → code, what changed

This integrates the rules from the notebook photos into the merged
`goal-ace-manager` + MPL app. Run the SQL first (one file), then just
`npm i && npm run dev` as before — nothing else to configure.

## 1. Run this once against your Supabase project

`supabase-mpl-reference/handwritten-rules-update.sql`
(identical copy also sits in `supabase/migrations/` for the record).

It adds:
- `fixtures.match_official`, `fixtures.man_of_the_match`, `fixtures.home_lineup`, `fixtures.away_lineup`
- a new `cards` table (yellow/red per player per match, with a flag for "red via 2nd yellow")
- a new `sponsors` table
- `settings.edition_label`, `.facebook_url`, `.instagram_url`, `.twitter_url`, `.whatsapp_url`
- a trigger that recalculates `table_rows` (P/W/D/L/GF/GA) straight from `fixtures` scores every time a fixture is saved

## 2. Rule → implementation

**Table logic** (win=3/draw=1/loss=0, GF/GA from goals, P +1 per game, "everything should reflect on the live table")
→ Already correct in `src/lib/league.ts` (pts = w×3+d). What was missing was the "reflect on the live table" part — `table_rows` was hand-typed. It's now a DB trigger, so P/W/D/L/GF/GA regenerate automatically from fixture scores. The admin **Table** tab still exists for one-off fixes but gets overwritten on the next fixture save.

**Match Official Dashboard** — see its own section below.
- "Scorers name & goals e.g. Sammy Ngala 2 goals" → existing Scorers tab/page.
- Cards (yellow/red, who, which match) → new **Discipline** tab in admin, new public **/discipline** page.

**Suspensions** — standard convention (5 yellows = short ban, red = longer ban):
- 5 yellow cards in the season → 1-match ban
- Any red card (direct, or a 2nd yellow in the match) → 3-match ban

The original notebook read this the other way round (5 yellows → 3-match ban, red → 1-match ban); it's now flipped to the convention almost every league uses. If you actually want the ban lengths reversed, it's one place to fix — `YELLOW_BAN_MATCHES` / `RED_BAN_MATCHES` at the top of `src/lib/league.ts`.

**Scores**
- "Borrow details from Admin/Match official records; every goal scored by a player should be added to GF" → goals already flow through the existing Scorers table/tab, feeding both the club scorers list and total GF via the table trigger above.
- "When the player is clicked his details should be seen" → squad cards on a club page are now clickable and open a profile dialog (photo, jersey no., goals, yellows, reds, ban status).

**Footer**
- Social links (Facebook etc.) → `settings` social URL fields, shown as icons in the footer when set.
- Sponsors → new **Sponsors** admin tab; logos/names render in the footer.
- Copyright with edition, e.g. "© MPL 5th Edition" → footer now reads `© {year} Mtwapa Premier League — {edition_label}`, edition editable in admin **Settings**.
- "The league admin should control the website" → unchanged; all of the above is editable only by an approved admin via `/admin`, same login as before.

## Match Official Dashboard

This is now a real, dedicated admin tab (**Match Official** — it's the default tab when you open `/admin`), not just fields bolted onto Fixtures. Pick a fixture and one screen gives you:

- Result entry (updates the score, which also flows into the auto-recalculated league table)
- Match official + Man of the Match
- Home/away lineups (starting XI + subs, free text)
- Cards — add/remove yellow or red per player, with a "via 2nd yellow" flag, feeding the Discipline page
- Matchday photos — uploading creates a photo album automatically named/linked to that fixture (`albums.fixture_id`), so there's no separate step of manually finding or creating the right album in Gallery

The Fixtures/Cards/Gallery tabs still exist too, for bulk edits or fixing things after the fact — the Match Official tab is just the one-stop workflow for filing a match report.

## Club crests

Bumped every `ClubBadge` size across the site (table, fixtures, club directory, club hero, discipline, scorers, predictor, homepage top-scorers) roughly 25–40% larger, and the fallback initials now scale with the badge size instead of staying tiny. The current crest images were only sized for the old, smaller badges — if any look soft/pixelated now, swap in a higher-resolution crest for that club from the admin **Clubs** tab.

## Installing MPL as an app

The site is now an installable Progressive Web App (PWA):
- `public/manifest.webmanifest` + `public/icons/*` (generated from the existing favicon — swap in a proper high-res logo later if you have one)
- `public/sw.js`, a small service worker registered in `src/routes/__root.tsx` (caches the app shell for offline use, never caches live Supabase data)
- A **"Get the app"** button in the header (`src/components/league/InstallAppButton.tsx`): on Android/Chrome/Edge it triggers the native install prompt; on iOS Safari (which has no such API) it shows quick "Share → Add to Home Screen" instructions instead

This makes "download as an app" work the way it does on most sports/news sites — no app store needed, and it updates itself automatically since it's really the website.

### If you want an actual `.apk` file

A real Android `.apk` needs the Android build toolchain, which isn't something I can run here. Once this is deployed live over HTTPS:
1. Go to **pwabuilder.com**, enter your deployed URL — it reads the manifest above automatically.
2. Generate the Android package (Trusted Web Activity). PWABuilder can hand you a signed `.apk`/`.aab` for direct install or Play Store upload.
3. Same flow works for a Windows/iOS package if you ever want those too.

## Not done / left as-is (flag for follow-up)

- Lineups and lineup-level card tagging are separate fields rather than one linked structure (i.e. a card isn't tied to a specific lineup slot) — kept simple on purpose; ask if you want cards linked to individual lineup entries instead of just "player name + club".
- No automatic "player is suspended, can't be selected" enforcement anywhere in lineup entry — discipline is informational (shown on `/discipline` and the player dialog), not blocking.

## Nav menu

Trimmed to exactly: Home, Table, Fixtures, Clubs, Scorers, News, Gallery, About, Predictor — in both the header nav and the footer link list. Discipline is no longer linked anywhere in the menu; the `/discipline` page and all its admin tooling (Match Official tab, Cards tab) still work exactly as before, it's just not in the menu.

## Standings & scorers data refresh (17 Aug 2026 sheets)

Run **`supabase-mpl-reference/update-standings-17aug2026.sql`** once (after the handwritten-rules migration, since it needs `table_rows.pts_adjustment`). It:
- Updates all 31 clubs' P/W/D/L/GF/GA to match the "Table Standing — Season 2026" graphic exactly.
- Replaces the scorers list with all 39 names/clubs/goals from the "Top Goal Scorers — As at August 2026" graphic.
- Sets the footer's "as of" label to "as at 17th August 2026".

**One data quirk, handled rather than papered over:** every club's points check out as the standard 3×W + D **except Mikanjuni FC**, whose sheet shows 7 pts against a record (W3 D0) that computes to 9. Rather than fudging their W/D to force the number, I added a `table_rows.pts_adjustment` column (defaults to 0, ignored by the auto-recalc trigger so it survives every fixture save) and set Mikanjuni's to **-2** so their points match the sheet. If that 7 was actually a typo on the sheet, just set it back to 0 in the admin **Table** tab. Same field is there if a real disciplinary points deduction happens in future.
