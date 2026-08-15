import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leagueQuery } from "@/lib/league";
import { PageHeader } from "@/components/league/PageHeader";
import { ClubBadge } from "@/components/league/ClubBadge";

export const Route = createFileRoute("/discipline")({
  head: () => ({
    meta: [
      { title: "Discipline | Mtwapa Premier League" },
      {
        name: "description",
        content: "Cards and match-ban status for every player across the Mtwapa Premier League season.",
      },
    ],
  }),
  component: DisciplinePage,
});

function DisciplinePage() {
  const { data } = useQuery(leagueQuery);
  const bans = (data?.discipline ?? []).filter((d) => d.banMatches > 0);
  const carded = (data?.discipline ?? []).filter((d) => d.banMatches === 0 && (d.yellowCount || d.redCount));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Fair Play"
        title="Discipline"
        lead="5 yellow cards in the season triggers a 1-match ban. Any red card — direct, or a 2nd yellow in the same match — triggers a 3-match ban."
      />

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold text-accent">Current bans</h2>
        {bans.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {bans.map((d) => {
              const club = d.clubId ? data?.clubMap[d.clubId] : undefined;
              return (
                <div key={`${d.clubId}-${d.playerName}`} className="surface-card flex items-center gap-3 p-4">
                  <ClubBadge club={club} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.playerName}</p>
                    <p className="eyebrow text-muted-foreground">{club?.name ?? "Unattached"}</p>
                    <p className="mt-1 text-xs font-bold text-destructive">{d.banReason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active suspensions.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-bold text-accent">Cards this season</h2>
        {carded.length ? (
          <div className="surface-card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Club</th>
                  <th className="px-4 py-3 text-right">Yellow</th>
                  <th className="px-4 py-3 text-right">Red</th>
                </tr>
              </thead>
              <tbody>
                {carded.map((d) => (
                  <tr key={`${d.clubId}-${d.playerName}`} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-semibold">{d.playerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(d.clubId && data?.clubMap[d.clubId]?.name) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{d.yellowCount || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{d.redCount || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No cards recorded yet.</p>
        )}
      </section>
    </div>
  );
}
