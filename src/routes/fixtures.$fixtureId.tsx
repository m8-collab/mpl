import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leagueQuery, liveRefetchInterval, fmtLongDate, type SuspensionStatus, type Club, type SquadPlayer } from "@/lib/league";
import { ClubBadge } from "@/components/league/ClubBadge";

export const Route = createFileRoute("/fixtures/$fixtureId")({
  head: () => ({
    meta: [
      { title: "Match Centre | Mtwapa Premier League" },
      { name: "description", content: "Match details, squads, and eligibility for this Mtwapa Premier League fixture." },
    ],
  }),
  component: FixtureDetailPage,
});

function FixtureDetailPage() {
  const { fixtureId } = Route.useParams();
  const { data } = useQuery({ ...leagueQuery, refetchInterval: liveRefetchInterval });
  const fixture = data?.fixtures.find((f) => f.id === fixtureId);

  if (!data) return <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">Loading…</div>;
  if (!fixture) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <p className="text-sm text-muted-foreground">Fixture not found.</p>
        <Link to="/fixtures" className="eyebrow text-accent">
          ← Back to fixtures
        </Link>
      </div>
    );
  }

  const home = fixture.home_id ? data.clubMap[fixture.home_id] : undefined;
  const away = fixture.away_id ? data.clubMap[fixture.away_id] : undefined;
  const played = fixture.home_score !== null && fixture.away_score !== null;
  const fixtureCards = data.cards.filter((c) => c.fixture_id === fixture.id);
  const fixtureGoals = data.goals.filter((g) => g.fixture_id === fixture.id).sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
  const fixtureAlbum = data.albums.find((a) => a.fixture_id === fixture.id);
  const fixturePhotos = fixtureAlbum ? data.photos.filter((p) => p.album_id === fixtureAlbum.id) : [];
  const homeLineup = data.appearances.filter((a) => a.fixture_id === fixture.id && a.club_id === fixture.home_id);
  const awayLineup = data.appearances.filter((a) => a.fixture_id === fixture.id && a.club_id === fixture.away_id);

  const homeGoals = fixtureGoals.filter((g) => g.club_id === fixture.home_id);
  const awayGoals = fixtureGoals.filter((g) => g.club_id === fixture.away_id);
  const homeCards = fixtureCards.filter((c) => c.club_id === fixture.home_id);
  const awayCards = fixtureCards.filter((c) => c.club_id === fixture.away_id);
  const reds = fixtureCards.filter((c) => c.card_type === "red").length;
  const yellows = fixtureCards.length - reds;

  // Plain-language match report built from the recorded result, goals and cards.
  const reportText = (() => {
    if (fixture.postponed) return `This fixture has been postponed.${fixture.postponed_note ? ` ${fixture.postponed_note}` : ""}`;
    if (!played) return "Match report will be available after the final whistle.";
    const hs = fixture.home_score!;
    const aw = fixture.away_score!;
    const hn = home?.name ?? "Home";
    const an = away?.name ?? "Away";
    const where = fixture.venue ? ` at ${fixture.venue}` : "";
    const result =
      hs === aw ? `${hn} and ${an} played out a ${hs}-${aw} draw` : hs > aw ? `${hn} beat ${an} ${hs}-${aw}` : `${an} beat ${hn} ${aw}-${hs} away`;
    const parts = [`${result}${where} on ${fmtLongDate(fixture.date)}.`];
    if (fixtureGoals.length) {
      parts.push(
        `Goals: ${fixtureGoals.map((g) => `${g.player_name}${g.minute !== null ? ` (${g.minute}')` : ""}`).join(", ")}.`,
      );
    }
    if (fixtureCards.length) {
      parts.push(`The referee showed ${yellows} yellow card${yellows === 1 ? "" : "s"} and ${reds} red card${reds === 1 ? "" : "s"}.`);
    }
    if (fixture.man_of_the_match) parts.push(`${fixture.man_of_the_match} was named Man of the Match.`);
    return parts.join(" ");
  })();

  // Keyed the same way computeDiscipline() keys its map, so lookups line up.
  const disciplineMap: Map<string, SuspensionStatus> = new Map(data.suspensions.map((d) => [`${d.clubId ?? ""}::${d.playerName}`, d]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <Link to="/fixtures" className="eyebrow text-accent">
        ← Back to fixtures
      </Link>

      <div className="surface-card mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="eyebrow text-muted-foreground">{fmtLongDate(fixture.date)} {fixture.kickoff ?? ""}</span>
          {fixture.postponed ? (
            <span className="eyebrow rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">Postponed</span>
          ) : fixture.live ? (
            <span className="eyebrow flex items-center gap-1.5 rounded-full bg-destructive px-2 py-0.5 text-destructive-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> LIVE
            </span>
          ) : (
            <span className="eyebrow text-accent">{played ? "Full time" : "Upcoming"}</span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-6">
          <Link to="/clubs/$clubId" params={{ clubId: home?.id ?? "" }} className="flex flex-col items-center gap-2 hover:text-accent">
            <ClubBadge club={home} size={56} />
            <span className="text-center text-sm font-bold">{home?.name ?? "TBC"}</span>
          </Link>
          <span className="font-display text-3xl font-black tabular-nums">
            {fixture.postponed ? "vs" : `${fixture.home_score ?? "–"} – ${fixture.away_score ?? "–"}`}
          </span>
          <Link to="/clubs/$clubId" params={{ clubId: away?.id ?? "" }} className="flex flex-col items-center gap-2 hover:text-accent">
            <ClubBadge club={away} size={56} />
            <span className="text-center text-sm font-bold">{away?.name ?? "TBC"}</span>
          </Link>
        </div>

        {fixture.venue && <p className="mt-4 text-center text-xs text-muted-foreground">{fixture.venue}</p>}
        {fixture.postponed && fixture.postponed_note && (
          <p className="mt-2 text-center text-xs text-destructive">{fixture.postponed_note}</p>
        )}
      </div>

      <section className="surface-card mt-6 p-5">
        <h2 className="font-display text-sm font-black uppercase tracking-wide">Match report</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{reportText}</p>
      </section>

      <section className="surface-card mt-6 p-5">
        <h2 className="mb-3 font-display text-sm font-black uppercase tracking-wide">Match details</h2>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Fact label="Date" value={fmtLongDate(fixture.date)} />
          <Fact label="Kick-off" value={fixture.kickoff} />
          <Fact label="Venue" value={fixture.venue} />
          <Fact label="Season" value={fixture.season} />
          <Fact label="Match no." value={fixture.match_no} />
          <Fact label="Match official" value={fixture.match_official} />
          <Fact label="Man of the Match" value={fixture.man_of_the_match ? `⭐ ${fixture.man_of_the_match}` : null} />
          <Fact
            label="Status"
            value={fixture.postponed ? "Postponed" : fixture.live ? "Live" : played ? "Full time" : "Upcoming"}
          />
        </dl>
      </section>

      {!fixture.postponed && (played || fixtureGoals.length > 0) && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-sm font-black uppercase tracking-wide">Goals</h2>
          {fixtureGoals.length === 0 ? (
            <p className="surface-card p-4 text-sm text-muted-foreground">
              {played && fixture.home_score === 0 && fixture.away_score === 0 ? "No goals — a goalless draw." : "Goal details not recorded yet."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <EventList title={home?.name ?? "Home"} items={homeGoals.map((g) => ({ id: g.id, text: g.player_name, minute: g.minute, icon: "⚽" }))} />
              <EventList title={away?.name ?? "Away"} items={awayGoals.map((g) => ({ id: g.id, text: g.player_name, minute: g.minute, icon: "⚽" }))} />
            </div>
          )}
        </section>
      )}

      {!fixture.postponed && played && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-sm font-black uppercase tracking-wide">Discipline</h2>
          {fixtureCards.length === 0 ? (
            <p className="surface-card p-4 text-sm text-muted-foreground">No cards shown in this match.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <EventList
                title={home?.name ?? "Home"}
                items={homeCards.map((c) => ({
                  id: c.id,
                  text: `${c.player_name}${c.foul_reason ? ` — ${c.foul_reason}` : ""}${c.red_via_two_yellows ? " (2nd yellow)" : ""}`,
                  minute: null,
                  icon: c.card_type === "red" ? "🟥" : "🟨",
                }))}
              />
              <EventList
                title={away?.name ?? "Away"}
                items={awayCards.map((c) => ({
                  id: c.id,
                  text: `${c.player_name}${c.foul_reason ? ` — ${c.foul_reason}` : ""}${c.red_via_two_yellows ? " (2nd yellow)" : ""}`,
                  minute: null,
                  icon: c.card_type === "red" ? "🟥" : "🟨",
                }))}
              />
            </div>
          )}
        </section>
      )}

      {(homeLineup.length > 0 || awayLineup.length > 0) && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <LineupColumn name={home?.name ?? "Home"} appearances={homeLineup} />
          <LineupColumn name={away?.name ?? "Away"} appearances={awayLineup} />
        </div>
      )}

      {fixturePhotos.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-sm font-black uppercase tracking-wide">Photos from this match</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {fixturePhotos.map((p) => (
              <img key={p.id} src={p.url} alt={p.caption ?? ""} className="aspect-square w-full rounded-sm object-cover" />
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Players marked <span className="font-semibold text-destructive">SUSPENDED</span> below are still serving an
        active disciplinary ban (5 yellow cards or any red card this season, by default — configurable in Settings).
        This is tracked match-by-match: a game only counts as "served" once it's been played AND the player has no
        recorded appearance in it. If a suspended player is selected anyway, the match official is warned but can
        proceed — that match then won't count toward serving the ban.
      </p>

      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <SquadColumn club={home} squad={home ? data.squads[home.id] ?? [] : []} disciplineMap={disciplineMap} />
        <SquadColumn club={away} squad={away ? data.squads[away.id] ?? [] : []} disciplineMap={disciplineMap} />
      </div>
    </div>
  );
}

function SquadColumn({
  club,
  squad,
  disciplineMap,
}: {
  club?: Club;
  squad: SquadPlayer[];
  disciplineMap: Map<string, SuspensionStatus>;
}) {
  return (
    <div className="surface-card p-4">
      <h2 className="mb-3 font-display text-sm font-black uppercase tracking-wide">{club?.name ?? "TBC"} squad</h2>
      {squad.length === 0 ? (
        <p className="text-sm text-muted-foreground">No squad list added yet.</p>
      ) : (
        <ul className="grid gap-2">
          {squad.map((p) => {
            const discipline = club ? disciplineMap.get(`${club.id}::${p.player_name}`) : undefined;
            const suspended = discipline?.suspended ?? false;
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-2 rounded-sm border px-3 py-2 text-sm ${
                  suspended ? "border-destructive/40 bg-destructive/5" : "border-border"
                }`}
              >
                <span className="flex items-center gap-2">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.player_name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-[0.6rem] font-bold text-muted-foreground">
                      {p.player_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                  )}
                  <span>
                    <span className="font-semibold">{p.player_name}</span>
                    {p.position && <span className="ml-2 text-xs text-muted-foreground">{p.position}</span>}
                  </span>
                </span>
                {suspended && (
                  <span
                    className="eyebrow shrink-0 rounded-full bg-destructive px-2 py-0.5 text-destructive-foreground"
                    title={`${discipline?.banReason ?? ""} — ${discipline?.matchesRemaining} match(es) remaining`}
                  >
                    Suspended ({discipline?.matchesRemaining} left)
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LineupColumn({ name, appearances }: { name: string; appearances: { player_name: string; started: boolean; subbed_on_minute: number | null; subbed_off_minute: number | null }[] }) {
  const starters = appearances.filter((a) => a.started);
  const subs = appearances.filter((a) => !a.started);
  return (
    <div className="surface-card p-4">
      <h2 className="mb-3 font-display text-sm font-black uppercase tracking-wide">{name} lineup</h2>
      {starters.length > 0 && (
        <>
          <p className="eyebrow mb-1 text-muted-foreground">Starting XI</p>
          <ul className="mb-3 grid gap-1 text-sm">
            {starters.map((a) => (
              <li key={a.player_name}>
                {a.player_name}
                {a.subbed_off_minute !== null && <span className="text-muted-foreground"> (off {a.subbed_off_minute}')</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {subs.length > 0 && (
        <>
          <p className="eyebrow mb-1 text-muted-foreground">Substitutes used</p>
          <ul className="grid gap-1 text-sm">
            {subs.map((a) => (
              <li key={a.player_name}>
                {a.player_name}
                {a.subbed_on_minute !== null && <span className="text-muted-foreground"> (on {a.subbed_on_minute}')</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}


function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

function EventList({
  title,
  items,
}: {
  title: string;
  items: { id: number; text: string; minute: number | null; icon: string }[];
}) {
  return (
    <div className="surface-card p-4">
      <h3 className="eyebrow mb-2 text-muted-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <ul className="grid gap-1.5 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex items-start gap-2">
              <span>{i.icon}</span>
              <span className="font-semibold">{i.text}</span>
              {i.minute !== null && <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">{i.minute}'</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
