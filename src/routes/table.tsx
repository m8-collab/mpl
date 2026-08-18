import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leagueQuery } from "@/lib/league";
import { StandingsTable } from "@/components/league/StandingsTable";
import { PageHeader } from "@/components/league/PageHeader";

export const Route = createFileRoute("/table")({
  head: () => ({
    meta: [
      { title: "League Table | Mtwapa Premier League" },
      { name: "description", content: "Full Mtwapa Premier League standings: played, won, drawn, lost, goal difference and points." },
      { property: "og:title", content: "Mtwapa Premier League Table" },
      { property: "og:description", content: "Live standings for every club in the Mtwapa Premier League." },
    ],
  }),
  component: TablePage,
});

function TablePage() {
  const { data, isPending } = useQuery(leagueQuery);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader eyebrow={data?.asOfLabel ?? "Standings"} title="League Table" />
      {isPending && <p className="text-sm text-muted-foreground">Loading standings…</p>}
      {data && <StandingsTable rows={data.standings} />}
      <p className="mt-4 text-xs text-muted-foreground">
        Green marks the championship places, red marks the relegation places. Points, then goal difference, then goals
        scored.
      </p>
    </div>
  );
}