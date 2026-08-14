import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { leagueQuery } from "@/lib/league";

export function SiteFooter() {
  const { data } = useQuery(leagueQuery);
  return (
    <footer className="pitch-panel mt-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-3 lg:px-8">
        <div>
          <div className="font-display text-lg font-extrabold uppercase">Mtwapa Premier League</div>
          <p className="mt-2 max-w-sm text-sm text-primary-foreground/70">
            {data?.seasonLabel ?? "Season 2026"} · {data?.clubs.length ?? 31} clubs, one table. Run by Mtwapa Premier
            CBO on the Kenyan coast.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link to="/table" className="text-primary-foreground/70 hover:text-mint">
            League Table
          </Link>
          <Link to="/fixtures" className="text-primary-foreground/70 hover:text-mint">
            Fixtures
          </Link>
          <Link to="/clubs" className="text-primary-foreground/70 hover:text-mint">
            Clubs
          </Link>
          <Link to="/scorers" className="text-primary-foreground/70 hover:text-mint">
            Top Scorers
          </Link>
          <Link to="/gallery" className="text-primary-foreground/70 hover:text-mint">
            Gallery
          </Link>
          <Link to="/about" className="text-primary-foreground/70 hover:text-mint">
            About
          </Link>
        </div>
        <div className="text-right">
          <p className="eyebrow text-primary-foreground/50">
            Table, fixtures &amp; scorers {data?.asOfLabel ?? ""}
          </p>
          <Link to="/admin" className="mt-2 inline-block text-xs text-primary-foreground/40 hover:text-mint">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}