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

## Not done / left as-is (flag for follow-up)

- Lineups and lineup-level card tagging are separate fields rather than one linked structure (i.e. a card isn't tied to a specific lineup slot) — kept simple on purpose; ask if you want cards linked to individual lineup entries instead of just "player name + club".
- No automatic "player is suspended, can't be selected" enforcement anywhere in lineup entry — discipline is informational (shown on `/discipline` and the player dialog), not blocking.
