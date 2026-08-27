import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { leagueQuery, liveRefetchInterval, fmtLongDate, type Fixture } from "@/lib/league";
import { MatchCard } from "@/components/league/MatchCard";
import { PageHeader } from "@/components/league/PageHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fixtures")({
  head: () => ({
    meta: [
      { title: "Fixtures & Results | Mtwapa Premier League" },
      { name: "description", content: "Every Mtwapa Premier League fixture and result by matchday, with venues and kickoff times." },
      { property: "og:title", content: "Mtwapa Premier League Fixtures" },
      { property: "og:description", content: "Upcoming matches and latest results across the league." },
    ],
  }),
  component: FixturesPage,
});

function FixturesPage() {
  const { data } = useQuery({ ...leagueQuery, refetchInterval: liveRefetchInterval });
  const [tab, setTab] = useState<"upcoming" | "results">("upcoming");
  const [season, setSeason] = useState<string>("");

  const played = (f: Fixture) => f.home_score !== null && f.away_score !== null;
  const seasons = data?.seasons ?? [];
  const activeSeason = season || seasons[seasons.length - 1] || "";
  const bySeasonList = (data?.fixtures ?? []).filter((f) => !activeSeason || !f.season || f.season === activeSeason);
  const list = bySeasonList.filter((f) => (tab === "results" ? played(f) : !played(f)));
  const byDate = new Map<string, Fixture[]>();
  list.forEach((f) => byDate.set(f.date, [...(byDate.get(f.date) ?? []), f]));
  const dates = [...byDate.keys()].sort((a, b) => (tab === "results" ? b.localeCompare(a) : a.localeCompare(b)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <PageHeader eyebrow="Matchday" title="Fixtures & Results" />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-sm border border-border bg-surface p-1">
          {(["upcoming", "results"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-sm px-4 py-2 font-display text-xs font-bold uppercase tracking-wide",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "upcoming" ? "Upcoming" : "Results"}
            </button>
          ))}
        </div>
        {seasons.length > 1 && (
          <select
            value={activeSeason}
            onChange={(e) => setSeason(e.target.value)}
            className="rounded-sm border border-border bg-surface px-3 py-2 font-display text-xs font-bold uppercase tracking-wide"
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {!dates.length && <p className="text-sm text-muted-foreground">No matches to show yet.</p>}

      <div className="grid gap-8">
        {dates.map((d) => (
          <section key={d}>
            <h2 className="mb-3 font-display text-sm font-bold text-accent">{fmtLongDate(d)}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {byDate.get(d)!.map((f) => (
                <MatchCard key={f.id} fixture={f} data={data!} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}