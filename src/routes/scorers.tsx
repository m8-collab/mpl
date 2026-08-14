import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leagueQuery, initials } from "@/lib/league";
import { ClubBadge } from "@/components/league/ClubBadge";
import { PageHeader } from "@/components/league/PageHeader";

export const Route = createFileRoute("/scorers")({
  head: () => ({
    meta: [
      { title: "Top Scorers | Mtwapa Premier League" },
      { name: "description", content: "The Golden Boot race: leading goalscorers and their clubs in the Mtwapa Premier League." },
      { property: "og:title", content: "Mtwapa Premier League Top Scorers" },
      { property: "og:description", content: "Who is leading the Golden Boot race this season." },
    ],
  }),
  component: ScorersPage,
});

function ScorersPage() {
  const { data } = useQuery(leagueQuery);
  const scorers = data?.scorers ?? [];
  const podium = scorers.slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <PageHeader eyebrow="Golden Boot" title="Top Scorers" />

      {podium.length > 0 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {podium.map((s, i) => (
            <div key={s.id} className="pitch-panel rounded-md p-5">
              <p className="eyebrow text-mint">{i === 0 ? "Leader" : `#${i + 1}`}</p>
              <p className="mt-2 font-display text-lg font-extrabold">{s.player_name}</p>
              <p className="text-sm text-primary-foreground/70">
                {s.club_id ? (data?.clubMap[s.club_id]?.name ?? "") : ""}
              </p>
              <p className="mt-3 font-display text-4xl font-black text-accent">{s.goals}</p>
            </div>
          ))}
        </div>
      )}

      <div className="surface-card divide-y divide-border">
        {scorers.map((s, i) => {
          const club = s.club_id ? data?.clubMap[s.club_id] : undefined;
          return (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 font-display text-xs font-bold text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-[0.65rem] font-bold text-primary">
                {initials(s.player_name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{s.player_name}</span>
                {club && (
                  <Link
                    to="/clubs/$clubId"
                    params={{ clubId: club.id }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent"
                  >
                    <ClubBadge club={club} size={14} />
                    {club.name}
                  </Link>
                )}
              </span>
              <span className="font-display text-lg font-extrabold tabular-nums">{s.goals}</span>
            </div>
          );
        })}
        {!scorers.length && <p className="p-4 text-sm text-muted-foreground">No goals recorded yet.</p>}
      </div>
    </div>
  );
}