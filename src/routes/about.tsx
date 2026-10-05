import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leagueQuery } from "@/lib/league";
import { PageHeader } from "@/components/league/PageHeader";
import { SupportLeagueCard } from "@/components/league/SupportLeague";
import { Mail, Globe, Phone } from "lucide-react";
import { LEAGUE_EMAIL, LEAGUE_HASHTAG, LEAGUE_OFFICIALS, LEAGUE_WEBSITE_LABEL, LEAGUE_WEBSITE_URL } from "@/lib/contacts";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the League | Mtwapa Premier League" },
      { name: "description", content: "How the Mtwapa Premier League works: format, rules, grounds and the community behind the competition." },
      { property: "og:title", content: "About the Mtwapa Premier League" },
      { property: "og:description", content: "Format, rules and the community behind the league." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data } = useQuery(leagueQuery);
  const clubCount = data?.clubs.length ?? 31;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="The competition"
        title="About the League"
        lead={`${clubCount} clubs from Mtwapa and the surrounding coast, playing one season-long league for the title.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat value={String(clubCount)} label="Clubs" />
        <Stat value={String(data?.fixtures.length ?? 0)} label="Fixtures scheduled" />
        <Stat value={String(data?.scorers.length ?? 0)} label="Players on the scoresheet" />
      </div>

      <div className="mt-10 grid gap-6">
        <Block title="Format">
          Every club plays in a single league table. Three points for a win, one for a draw. Ties are separated by goal
          difference, then goals scored.
        </Block>
        <Block title="Matchdays">
          Fixtures are played across community grounds around Mtwapa, with kickoff times confirmed on the fixtures page
          before each matchday.
        </Block>
        <Block title="Discipline & eligibility">
          Players must be registered with their club squad before featuring. Registration lists are published on each
          club page.
        </Block>
        <Block title="Who runs it">
          The league is organised by the Mtwapa Premier community organising committee, with results, scorers and photos
          submitted by club officials after each matchday.
        </Block>
      </div>

      <section id="contact" className="surface-card mt-6 scroll-mt-24 p-6">
        <h2 className="font-display text-lg">Contact the league</h2>
        <p className="mt-1 text-sm font-semibold text-accent">{LEAGUE_HASHTAG}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {LEAGUE_OFFICIALS.map((o) => (
            <a
              key={o.role}
              href={`tel:${o.phoneIntl}`}
              className="flex items-center gap-3 rounded-sm border border-border p-3 transition-colors hover:border-accent"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-accent">
                <Phone size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{o.name}</span>
                <span className="eyebrow block text-muted-foreground">{o.role}</span>
                <span className="block text-sm tabular-nums">{o.phoneDisplay}</span>
              </span>
            </a>
          ))}
        </div>
        <div className="mt-4 grid gap-2 border-t border-border pt-4 text-sm">
          <a href={`mailto:${LEAGUE_EMAIL}`} className="flex items-center gap-2 break-all hover:text-accent">
            <Mail size={16} className="shrink-0" /> {LEAGUE_EMAIL}
          </a>
          <a href={LEAGUE_WEBSITE_URL} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 hover:text-accent">
            <Globe size={16} className="shrink-0" /> {LEAGUE_WEBSITE_LABEL}
          </a>
        </div>
      </section>

      <div className="mt-6">
        <SupportLeagueCard />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="surface-card p-5">
      <p className="font-display text-4xl font-black text-accent">{value}</p>
      <p className="eyebrow mt-1 text-muted-foreground">{label}</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-6">
      <h2 className="font-display text-lg">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </section>
  );
}