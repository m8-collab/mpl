import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leagueQuery } from "@/lib/league";
import { PageHeader } from "@/components/league/PageHeader";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News | Mtwapa Premier League" },
      { name: "description", content: "Match reports, league announcements and club news from around the Mtwapa Premier League." },
      { property: "og:title", content: "Mtwapa Premier League News" },
      { property: "og:description", content: "The latest from around the league." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { data } = useQuery(leagueQuery);
  const news = data?.news ?? [];
  const [lead, ...rest] = news;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <PageHeader eyebrow="Latest" title="League News" />
      {!news.length && <p className="text-sm text-muted-foreground">No stories published yet.</p>}
      {lead && (
        <article className="pitch-panel mb-6 rounded-md p-8">
          <p className="eyebrow text-mint">{lead.tag ?? "News"}</p>
          <h2 className="mt-2 font-display text-2xl font-black lg:text-4xl">{lead.title}</h2>
          {lead.body && <p className="mt-3 max-w-3xl text-sm text-primary-foreground/80">{lead.body}</p>}
        </article>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((n) => (
          <article key={n.id} className="surface-card p-5">
            <p className="eyebrow text-accent">{n.tag ?? "News"}</p>
            <h3 className="mt-2 font-display text-base">{n.title}</h3>
            {n.body && <p className="mt-2 text-sm text-muted-foreground">{n.body}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}