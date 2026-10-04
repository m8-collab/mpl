import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leagueQuery, ordinal } from "@/lib/league";
import { ClubBadge } from "@/components/league/ClubBadge";
import { PageHeader } from "@/components/league/PageHeader";

export const Route = createFileRoute("/clubs/")({
  head: () => ({
    meta: [
      { title: "Clubs | Mtwapa Premier League" },
      { name: "description", content: "Every club competing in the Mtwapa Premier League, with crests, home grounds and squads." },
      { property: "og:title", content: "Mtwapa Premier League Clubs" },
      { property: "og:description", content: "Browse all clubs, grounds and squads in the league." },
    ],
  }),
  component: ClubsPage,
});

function ClubsPage() {
  const { data } = useQuery(leagueQuery);
  const rank = new Map(data?.standings.map((s) => [s.club_id, s.rank]) ?? []);
  const activeClubs = (data?.clubs ?? []).filter((c) => c.active);
  const discontinuedClubs = (data?.clubs ?? []).filter((c) => !c.active);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow={`${activeClubs.length} clubs`}
        title="The Clubs"
        lead="One league, one table. Tap a club for its squad, ground and league position."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activeClubs.map((c) => (
          <Link
            key={c.id}
            to="/clubs/$clubId"
            params={{ clubId: c.id }}
            className="surface-card flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
          >
            <ClubBadge club={c} size={56} />
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold uppercase">{c.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {rank.get(c.id) ? `${ordinal(rank.get(c.id)!)} · ` : ""}
                {c.venue ?? "Ground TBC"}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {discontinuedClubs.length > 0 && (
        <div className="mt-10">
          <p className="eyebrow mb-3 text-muted-foreground">No longer competing</p>
          <div className="flex flex-wrap gap-2">
            {discontinuedClubs.map((c) => (
              <Link
                key={c.id}
                to="/clubs/$clubId"
                params={{ clubId: c.id }}
                className="flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-sm text-muted-foreground hover:text-accent"
              >
                <ClubBadge club={c} size={24} />
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}