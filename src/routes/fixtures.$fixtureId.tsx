import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leagueQuery, liveRefetchInterval, fmtLongDate, type PlayerDiscipline, type Club, type SquadPlayer } from "@/lib/league";
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

  // Keyed the same way computeDiscipline() keys its map, so lookups line up.
  const disciplineMap: Map<string, PlayerDiscipline> = new Map(data.discipline.map((d) => [`${d.clubId ?? ""}::${d.playerName}`, d]));

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
        {(fixture.match_official || fixture.man_of_the_match) && (
          <div className="mt-4 grid gap-1 border-t border-border pt-3 text-center text-xs text-muted-foreground">
            {fixture.match_official && <p><span className="font-semibold text-foreground">Match official:</span> {fixture.match_official}</p>}
            {fixture.man_of_the_match && <p><span className="font-semibold text-foreground">Man of the Match:</span> {fixture.man_of_the_match}</p>}
          </div>
        )}
        {fixtureCards.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2 border-t border-border pt-3">
            {fixtureCards.map((c) => (
              <span
                key={c.id}
                className={`eyebrow rounded-full px-2 py-0.5 ${c.card_type === "red" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700"}`}
              >
                {c.card_type === "red" ? "🟥" : "🟨"} {c.player_name}
                {c.foul_reason ? ` — ${c.foul_reason}` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Players marked <span className="font-semibold text-destructive">SUSPENDED</span> below are carrying an
        active disciplinary ban (5 yellow cards or any red card this season) and shouldn't be selected. This
        reflects each player's total season discipline record — it doesn't automatically track how many of their
        ban matches have already been served, so double-check against recent team sheets near the end of a
        suspension.
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
  disciplineMap: Map<string, PlayerDiscipline>;
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
            const suspended = (discipline?.banMatches ?? 0) > 0;
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-2 rounded-sm border px-3 py-2 text-sm ${
                  suspended ? "border-destructive/40 bg-destructive/5" : "border-border"
                }`}
              >
                <span>
                  <span className="font-semibold">{p.player_name}</span>
                  {p.position && <span className="ml-2 text-xs text-muted-foreground">{p.position}</span>}
                </span>
                {suspended && (
                  <span className="eyebrow shrink-0 rounded-full bg-destructive px-2 py-0.5 text-destructive-foreground" title={discipline?.banReason ?? undefined}>
                    Suspended
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
