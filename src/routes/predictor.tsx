import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { leagueQuery, fmtDate, type Fixture } from "@/lib/league";
import { PageHeader } from "@/components/league/PageHeader";
import { ClubBadge } from "@/components/league/ClubBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/predictor")({
  head: () => ({
    meta: [
      { title: "Fan Predictor | Mtwapa Premier League" },
      { name: "description", content: "Pick the winners of the next round of Mtwapa Premier League fixtures and save your predictions." },
      { property: "og:title", content: "Mtwapa Premier League Fan Predictor" },
      { property: "og:description", content: "Call the results before kickoff." },
    ],
  }),
  component: PredictorPage,
});

type Pick = "home" | "draw" | "away";
const KEY = "mpl-predictions";

function PredictorPage() {
  const { data } = useQuery(leagueQuery);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPicks(JSON.parse(raw) as Record<string, Pick>);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(picks));
  }, [picks, hydrated]);

  const upcoming = (data?.fixtures ?? []).filter((f) => f.home_score === null && f.away_score === null).slice(0, 12);
  const made = upcoming.filter((f) => picks[f.id]).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Fan predictor"
        title="Call It Before Kickoff"
        lead="Pick a winner for each upcoming fixture. Your picks are saved on this device."
      />
      <p className="eyebrow mb-4 text-accent">
        {made} of {upcoming.length} predicted
      </p>

      <div className="grid gap-3">
        {upcoming.map((f) => (
          <PredictRow
            key={f.id}
            fixture={f}
            homeName={f.home_id ? (data?.clubMap[f.home_id]?.name ?? "TBC") : "TBC"}
            awayName={f.away_id ? (data?.clubMap[f.away_id]?.name ?? "TBC") : "TBC"}
            homeCrest={f.home_id ? data?.clubMap[f.home_id] : undefined}
            awayCrest={f.away_id ? data?.clubMap[f.away_id] : undefined}
            pick={picks[f.id]}
            onPick={(p) => setPicks((prev) => ({ ...prev, [f.id]: p }))}
          />
        ))}
        {!upcoming.length && <p className="text-sm text-muted-foreground">No upcoming fixtures to predict.</p>}
      </div>

      {made > 0 && (
        <button
          onClick={() => setPicks({})}
          className="mt-6 rounded-sm border border-border px-4 py-2 font-display text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
        >
          Reset picks
        </button>
      )}
    </div>
  );
}

function PredictRow({
  fixture,
  homeName,
  awayName,
  homeCrest,
  awayCrest,
  pick,
  onPick,
}: {
  fixture: Fixture;
  homeName: string;
  awayName: string;
  homeCrest?: Parameters<typeof ClubBadge>[0]["club"];
  awayCrest?: Parameters<typeof ClubBadge>[0]["club"];
  pick?: Pick | undefined;
  onPick: (p: Pick) => void;
}) {
  const options: { key: Pick; label: string }[] = [
    { key: "home", label: homeName },
    { key: "draw", label: "Draw" },
    { key: "away", label: awayName },
  ];
  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-muted-foreground">{fmtDate(fixture.date)}</span>
        <span className="eyebrow text-muted-foreground">{fixture.venue ?? ""}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <ClubBadge club={homeCrest} size={22} />
        <span className="text-sm font-semibold">{homeName}</span>
        <span className="eyebrow text-muted-foreground">v</span>
        <span className="text-sm font-semibold">{awayName}</span>
        <ClubBadge club={awayCrest} size={22} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => onPick(o.key)}
            className={cn(
              "truncate rounded-sm border px-2 py-2 font-display text-xs font-bold uppercase",
              pick === o.key
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:border-accent hover:text-accent",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}