import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leagueQuery, initials, ordinal } from "@/lib/league";
import { ClubBadge } from "@/components/league/ClubBadge";
import { MatchCard } from "@/components/league/MatchCard";

export const Route = createFileRoute("/clubs/$clubId")({
  head: () => ({
    meta: [
      { title: "Club Profile | Mtwapa Premier League" },
      { name: "description", content: "Club profile: squad list, home ground, league position, form and upcoming fixtures." },
      { property: "og:title", content: "Club Profile | Mtwapa Premier League" },
      { property: "og:description", content: "Squad, ground, standings position and fixtures for this club." },
    ],
  }),
  component: ClubPage,
});

function ClubPage() {
  const { clubId } = Route.useParams();
  const { data } = useQuery(leagueQuery);
  const club = data?.clubMap[clubId];
  const row = data?.standings.find((s) => s.club_id === clubId);
  const squad = data?.squads[clubId] ?? [];
  const matches = (data?.fixtures ?? []).filter((f) => f.home_id === clubId || f.away_id === clubId);
  const scorers = (data?.scorers ?? []).filter((s) => s.club_id === clubId);

  if (!data) return <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">Loading club…</div>;
  if (!club)
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="font-display text-2xl">Club not found</h1>
        <Link to="/clubs" className="mt-4 inline-block text-accent">
          Back to all clubs
        </Link>
      </div>
    );

  return (
    <div>
      <div className="pitch-panel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 px-4 py-10 lg:px-8">
          <ClubBadge club={club} size={84} className="bg-primary-foreground/10" />
          <div>
            <p className="eyebrow text-mint">{club.venue ?? "Ground TBC"}</p>
            <h1 className="mt-1 font-display text-3xl font-black lg:text-5xl">{club.name}</h1>
            {row && (
              <p className="mt-2 text-sm text-primary-foreground/75">
                {ordinal(row.rank)} · {row.pts} pts · {row.p} played · {row.gf}-{row.ga} ({row.gd > 0 ? "+" : ""}
                {row.gd})
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-3 lg:px-8">
        <section className="lg:col-span-2">
          <h2 className="mb-4 font-display text-xl">Squad</h2>
          {squad.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {squad.map((p) => (
                <div key={p.id} className="surface-card flex items-center gap-3 p-3">
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={p.player_name}
                      loading="lazy"
                      className="h-14 w-14 rounded-sm object-cover"
                    />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-sm bg-secondary font-display text-sm text-primary">
                      {initials(p.player_name)}
                    </span>
                  )}
                  <span>
                    <span className="block text-sm font-semibold">{p.player_name}</span>
                    <span className="eyebrow text-muted-foreground">
                      {p.jersey_no ? `No. ${p.jersey_no}` : "Squad"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Squad list coming soon.</p>
          )}

          <h2 className="mt-10 mb-4 font-display text-xl">Matches</h2>
          {matches.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {matches.map((f) => (
                <MatchCard key={f.id} fixture={f} data={data} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No scheduled matches yet.</p>
          )}
        </section>

        <aside className="grid gap-6 self-start">
          <div className="surface-card p-5">
            <h2 className="font-display text-base">Club scorers</h2>
            {scorers.length ? (
              <ul className="mt-3 grid gap-2 text-sm">
                {scorers.map((s) => (
                  <li key={s.id} className="flex justify-between border-b border-border pb-2 last:border-0">
                    <span>{s.player_name}</span>
                    <span className="font-display font-bold">{s.goals}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No goals recorded yet.</p>
            )}
          </div>
          <Link to="/clubs" className="eyebrow text-accent">
            ← All clubs
          </Link>
        </aside>
      </div>
    </div>
  );
}