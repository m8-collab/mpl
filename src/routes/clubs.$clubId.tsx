import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { leagueQuery, initials, ordinal, type SquadPlayer } from "@/lib/league";
import { ClubBadge } from "@/components/league/ClubBadge";
import { MatchCard } from "@/components/league/MatchCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const [activePlayer, setActivePlayer] = useState<SquadPlayer | null>(null);

  const headToHead = (() => {
    const byOpponent = new Map<string, { w: number; d: number; l: number; gf: number; ga: number }>();
    matches.forEach((f) => {
      if (f.postponed || f.home_score === null || f.away_score === null) return;
      const isHome = f.home_id === clubId;
      const opponentId = isHome ? f.away_id : f.home_id;
      if (!opponentId) return;
      const gf = isHome ? f.home_score : f.away_score;
      const ga = isHome ? f.away_score : f.home_score;
      const rec = byOpponent.get(opponentId) ?? { w: 0, d: 0, l: 0, gf: 0, ga: 0 };
      rec.gf += gf;
      rec.ga += ga;
      if (gf > ga) rec.w += 1;
      else if (gf === ga) rec.d += 1;
      else rec.l += 1;
      byOpponent.set(opponentId, rec);
    });
    return Array.from(byOpponent.entries())
      .map(([opponentId, rec]) => ({ opponent: data?.clubMap[opponentId], ...rec }))
      .filter((r) => r.opponent)
      .sort((a, b) => a.opponent!.name.localeCompare(b.opponent!.name));
  })();

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
          <ClubBadge club={club} size={104} className="bg-primary-foreground/10" />
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
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePlayer(p)}
                  className="surface-card flex items-center gap-3 p-3 text-left transition-colors hover:border-accent"
                >
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
                      {p.position || "Squad"}
                    </span>
                  </span>
                </button>
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
          <ClubInquiryForm clubId={clubId} clubName={club.name} />
          <Link to="/clubs" className="eyebrow text-accent">
            ← All clubs
          </Link>
        </aside>
      </div>

      {headToHead.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pb-10 lg:px-8">
          <h2 className="mb-4 font-display text-xl">Head-to-head record</h2>
          <div className="surface-card divide-y divide-border overflow-x-auto">
            {headToHead.map((r) => (
              <div key={r.opponent!.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <Link
                  to="/clubs/$clubId"
                  params={{ clubId: r.opponent!.id }}
                  className="flex min-w-0 items-center gap-2 font-semibold hover:text-accent"
                >
                  <ClubBadge club={r.opponent!} size={22} />
                  <span className="truncate">{r.opponent!.name}</span>
                </Link>
                <span className="shrink-0 text-muted-foreground">
                  <span className="font-bold text-foreground">{r.w}</span>W{" "}
                  <span className="font-bold text-foreground">{r.d}</span>D{" "}
                  <span className="font-bold text-foreground">{r.l}</span>L
                  <span className="ml-2">
                    ({r.gf}-{r.ga})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!activePlayer} onOpenChange={(open) => !open && setActivePlayer(null)}>
        <DialogContent>
          {activePlayer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {activePlayer.photo_url ? (
                    <img
                      src={activePlayer.photo_url}
                      alt={activePlayer.player_name}
                      className="h-14 w-14 rounded-sm object-cover"
                    />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-sm bg-secondary font-display text-sm text-primary">
                      {initials(activePlayer.player_name)}
                    </span>
                  )}
                  <span>
                    <span className="block">{activePlayer.player_name}</span>
                    <span className="eyebrow block font-normal text-muted-foreground">
                      {club.name} {activePlayer.position ? `· ${activePlayer.position}` : ""}
                    </span>
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="surface-card p-3">
                  <p className="font-display text-xl font-extrabold">
                    {data?.scorers.find((s) => s.player_name === activePlayer.player_name)?.goals ?? 0}
                  </p>
                  <p className="eyebrow text-muted-foreground">Goals</p>
                </div>
                <div className="surface-card p-3">
                  <p className="font-display text-xl font-extrabold">
                    {data?.discipline.find((d) => d.playerName === activePlayer.player_name)?.yellowCount ?? 0}
                  </p>
                  <p className="eyebrow text-muted-foreground">Yellows</p>
                </div>
                <div className="surface-card p-3">
                  <p className="font-display text-xl font-extrabold">
                    {data?.discipline.find((d) => d.playerName === activePlayer.player_name)?.redCount ?? 0}
                  </p>
                  <p className="eyebrow text-muted-foreground">Reds</p>
                </div>
              </div>
              {(() => {
                const ban = data?.discipline.find((d) => d.playerName === activePlayer.player_name);
                return ban?.banMatches ? (
                  <p className="mt-3 text-xs font-bold text-destructive">{ban.banReason}</p>
                ) : null;
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function ClubInquiryForm({ clubId, clubName }: { clubId: string; clubName: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("inquiries").insert({
      name,
      phone,
      club_id: clubId,
      message,
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't send that — try again in a moment.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="surface-card p-5">
        <h2 className="font-display text-base">Message sent</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks — {clubName} and the league admin can see your message. They'll reach out on the number you left if
          needed.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card p-5">
      <h2 className="font-display text-base">Contact {clubName}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Player registration interest, sponsorship, or anything else — this goes straight to the league admin.
      </p>
      <form onSubmit={submit} className="mt-3 grid gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" required />
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your message" rows={3} required />
        <Button type="submit" disabled={busy} size="sm" className="w-fit">
          {busy ? "Sending…" : "Send message"}
        </Button>
      </form>
    </div>
  );
}
