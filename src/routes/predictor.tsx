import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { leagueQuery, computePredictorLeaderboard, fmtDate, type Fixture } from "@/lib/league";
import { PageHeader } from "@/components/league/PageHeader";
import { ClubBadge } from "@/components/league/ClubBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/predictor")({
  head: () => ({
    meta: [
      { title: "Fan Predictor | Mtwapa Premier League" },
      { name: "description", content: "Pick the winners of the next round of Mtwapa Premier League fixtures and climb the predictor leaderboard." },
      { property: "og:title", content: "Mtwapa Premier League Fan Predictor" },
      { property: "og:description", content: "Call the results before kickoff." },
    ],
  }),
  component: PredictorPage,
});

type Pick = "home" | "draw" | "away";
const IDENTITY_KEY = "mpl-predictor-identity";

function PredictorPage() {
  const { data } = useQuery(leagueQuery);
  const queryClient = useQueryClient();
  const [identity, setIdentity] = useState<{ name: string; phone: string } | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(IDENTITY_KEY);
      if (raw) setIdentity(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function saveIdentity(e: FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    if (!name || !phone) return;
    const id = { name, phone };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
    setIdentity(id);
  }

  async function makePick(fixtureId: string, pick: Pick) {
    if (!identity) return;
    setSubmitting(fixtureId);
    const { error } = await supabase.from("predictions").insert({
      fixture_id: fixtureId,
      name: identity.name,
      phone: identity.phone,
      pick,
    });
    setSubmitting(null);
    if (error) {
      if (error.code === "23505") {
        toast.error("You've already predicted this fixture — one pick per match.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Pick locked in");
    queryClient.invalidateQueries({ queryKey: ["league"] });
  }

  const upcoming = (data?.fixtures ?? []).filter((f) => f.home_score === null && f.away_score === null && !f.postponed).slice(0, 12);
  const myPicks = new Map(
    (data?.predictions ?? []).filter((p) => p.phone === identity?.phone).map((p) => [p.fixture_id, p.pick]),
  );
  const leaderboard = computePredictorLeaderboard(data?.predictions ?? [], data?.fixtures ?? []).slice(0, 15);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Fan predictor"
        title="Call It Before Kickoff"
        lead="Pick a winner for each upcoming fixture. Once you're set up, picks are locked in — no changing your mind after kickoff."
      />

      {!identity ? (
        <form onSubmit={saveIdentity} className="surface-card mb-8 grid max-w-sm gap-3 p-4">
          <p className="font-display text-xs font-black uppercase tracking-wide">Enter your name to start predicting</p>
          <Input name="name" placeholder="Your name" required />
          <Input name="phone" placeholder="Phone number" required />
          <Button type="submit">Start predicting</Button>
          <p className="text-xs text-muted-foreground">
            Used to identify your picks on the leaderboard — no account needed, no spam.
          </p>
        </form>
      ) : (
        <p className="eyebrow mb-4 text-accent">
          Predicting as {identity.name} ·{" "}
          <button className="underline" onClick={() => { localStorage.removeItem(IDENTITY_KEY); setIdentity(null); }}>
            not you?
          </button>
        </p>
      )}

      <div className="grid gap-3">
        {upcoming.map((f) => (
          <PredictRow
            key={f.id}
            fixture={f}
            homeName={f.home_id ? (data?.clubMap[f.home_id]?.name ?? "TBC") : "TBC"}
            awayName={f.away_id ? (data?.clubMap[f.away_id]?.name ?? "TBC") : "TBC"}
            homeCrest={f.home_id ? data?.clubMap[f.home_id] : undefined}
            awayCrest={f.away_id ? data?.clubMap[f.away_id] : undefined}
            pick={myPicks.get(f.id) as Pick | undefined}
            disabled={!identity || submitting === f.id}
            onPick={(p) => makePick(f.id, p)}
          />
        ))}
        {!upcoming.length && <p className="text-sm text-muted-foreground">No upcoming fixtures to predict.</p>}
      </div>

      <h2 className="mb-4 mt-12 font-display text-xl">Leaderboard</h2>
      {leaderboard.length ? (
        <div className="surface-card divide-y divide-border">
          {leaderboard.map((row, i) => (
            <div key={row.phone} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-3">
                <span className="w-5 font-display text-xs font-bold text-muted-foreground">{i + 1}</span>
                <span className="font-semibold">{row.name}</span>
              </span>
              <span className="text-muted-foreground">
                <span className="font-display font-bold text-foreground">{row.correct}</span> / {row.total} correct
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          The leaderboard fills in once predicted fixtures are played — make some picks above to get on it.
        </p>
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
  disabled,
  onPick,
}: {
  fixture: Fixture;
  homeName: string;
  awayName: string;
  homeCrest?: Parameters<typeof ClubBadge>[0]["club"];
  awayCrest?: Parameters<typeof ClubBadge>[0]["club"];
  pick?: Pick | undefined;
  disabled?: boolean;
  onPick: (p: Pick) => void;
}) {
  const locked = !!pick;
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
        <ClubBadge club={homeCrest} size={28} />
        <span className="text-sm font-semibold">{homeName}</span>
        <span className="eyebrow text-muted-foreground">v</span>
        <span className="text-sm font-semibold">{awayName}</span>
        <ClubBadge club={awayCrest} size={28} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            disabled={disabled || locked}
            onClick={() => onPick(o.key)}
            className={cn(
              "truncate rounded-sm border px-2 py-2 font-display text-xs font-bold uppercase disabled:cursor-not-allowed",
              pick === o.key
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted-foreground enabled:hover:border-accent enabled:hover:text-accent",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {locked && <p className="mt-2 text-xs text-muted-foreground">Pick locked in — good luck.</p>}
    </div>
  );
}
