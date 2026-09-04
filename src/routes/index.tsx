import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leagueQuery, liveRefetchInterval, isPlayed } from "@/lib/league";
import { StandingsTable } from "@/components/league/StandingsTable";
import { MatchCard } from "@/components/league/MatchCard";
import { ClubBadge } from "@/components/league/ClubBadge";
import heroImage from "@/assets/hero-match.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mtwapa Premier League | Table, Fixtures & Results" },
      {
        name: "description",
        content:
          "Official home of the Mtwapa Premier League: live table, fixtures, results, club squads, top scorers and matchday photos.",
      },
      { property: "og:title", content: "Mtwapa Premier League" },
      {
        property: "og:description",
        content: "Live table, fixtures, results, squads and top scorers from the Mtwapa Premier League.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data } = useQuery({ ...leagueQuery, refetchInterval: liveRefetchInterval });
  const upcoming = (data?.fixtures ?? []).filter((f) => !isPlayed(f)).slice(0, 3);
  const results = (data?.fixtures ?? []).filter(isPlayed).slice(-3).reverse();
  const topFive = data?.standings.slice(0, 5) ?? [];
  const topScorers = data?.scorers.slice(0, 5) ?? [];

  return (
    <div>
      <section className="relative overflow-hidden pitch-panel">
        <img
          src={heroImage}
          alt="Floodlit Mtwapa Premier League match at dusk"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
          <p className="eyebrow text-mint">{data?.seasonLabel ?? "Season 2026"}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
            The coast&apos;s toughest league
          </h1>
          <p className="mt-4 max-w-xl text-base text-primary-foreground/80">
            {data?.clubs.length ?? 31} clubs. One table. Every result, squad and goal from the Mtwapa Premier League.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/table"
              className="rounded-sm bg-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-accent-foreground transition-opacity hover:opacity-90"
            >
              View the table
            </Link>
            <Link
              to="/fixtures"
              className="rounded-sm border border-primary-foreground/30 px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary-foreground/10"
            >
              Fixtures
            </Link>
          </div>
        </div>
      </section>

      {!!data?.sponsors.length && (
        <div className="border-b border-border bg-secondary/40">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 lg:px-8">
            <p className="eyebrow shrink-0 text-muted-foreground">Proudly supported by</p>
            {data.sponsors.map((s) =>
              s.logo_url ? (
                <a key={s.id} href={s.link ?? undefined} target="_blank" rel="noreferrer noopener sponsored" title={s.name}>
                  <img src={s.logo_url} alt={s.name} className="h-7 w-auto object-contain opacity-80 transition-opacity hover:opacity-100" />
                </a>
              ) : (
                <span key={s.id} className="text-sm font-semibold text-muted-foreground">
                  {s.name}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionHead title="Top of the table" to="/table" cta="Full table" />
            <StandingsTable rows={topFive} />

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div>
                <SectionHead title="Next up" to="/fixtures" cta="All fixtures" />
                <div className="grid gap-3">
                  {data && upcoming.map((f) => <MatchCard key={f.id} fixture={f} data={data} />)}
                  {!upcoming.length && <p className="text-sm text-muted-foreground">No fixtures scheduled.</p>}
                </div>
              </div>
              <div>
                <SectionHead title="Latest results" to="/fixtures" cta="All results" />
                <div className="grid gap-3">
                  {data && results.map((f) => <MatchCard key={f.id} fixture={f} data={data} />)}
                  {!results.length && <p className="text-sm text-muted-foreground">No results yet.</p>}
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-8 self-start">
            <div>
              <SectionHead title="Golden boot" to="/scoreboard" cta="See scoreboard" />
              <div className="surface-card divide-y divide-border">
                {topScorers.map((s, i) => {
                  const club = s.club_id ? data?.clubMap[s.club_id] : undefined;
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-4 font-display text-xs text-muted-foreground">{i + 1}</span>
                      <ClubBadge club={club} size={28} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{s.player_name}</span>
                      <span className="font-display font-extrabold tabular-nums">{s.goals}</span>
                    </div>
                  );
                })}
                {!topScorers.length && <p className="p-4 text-sm text-muted-foreground">No goals recorded yet.</p>}
              </div>
            </div>

            {data?.news[0] && (
              <div>
                <SectionHead title="League news" to="/news" cta="More news" />
                <article className="surface-card overflow-hidden p-0">
                  {data.news[0].image_url && (
                    <img src={data.news[0].image_url} alt={data.news[0].title} className="h-40 w-full object-cover" />
                  )}
                  <div className="p-5">
                    <p className="eyebrow text-accent">{data.news[0].tag ?? "News"}</p>
                    <h3 className="mt-2 font-display text-base">{data.news[0].title}</h3>
                    {data.news[0].body && (
                      <p className="mt-2 text-sm text-muted-foreground">{data.news[0].body}</p>
                    )}
                  </div>
                </article>
              </div>
            )}

            <div className="pitch-panel rounded-md p-6">
              <p className="eyebrow text-mint">Fan zone</p>
              <h3 className="mt-2 font-display text-xl">Predict the next round</h3>
              <p className="mt-2 text-sm text-primary-foreground/75">
                Call the winners before kickoff and keep your picks on this device.
              </p>
              <Link
                to="/predictor"
                className="mt-4 inline-block rounded-sm bg-accent px-4 py-2 font-display text-xs font-bold uppercase text-accent-foreground"
              >
                Make your picks
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ title, to, cta }: { title: string; to: "/table" | "/fixtures" | "/scoreboard" | "/news"; cta: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="font-display text-xl lg:text-2xl">{title}</h2>
      <Link to={to} className="eyebrow shrink-0 text-accent hover:underline">
        {cta}
      </Link>
    </div>
  );
}
