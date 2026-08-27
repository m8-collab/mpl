import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { leagueQuery, isPlayed, fmtDate } from "@/lib/league";
import { InstallAppButton } from "./InstallAppButton";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/table", label: "Table" },
  { to: "/fixtures", label: "Fixtures" },
  { to: "/clubs", label: "Clubs" },
  { to: "/scoreboard", label: "Scoreboard" },
  { to: "/news", label: "News" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
  { to: "/predictor", label: "Predictor" },
] as const;

function Ticker() {
  const { data } = useQuery(leagueQuery);
  if (!data) return null;
  const items = data.fixtures
    .filter((f) => !isPlayed(f))
    .slice(0, 12)
    .map((f) => {
      const home = f.home_id ? data.clubMap[f.home_id]?.name : "TBC";
      const away = f.away_id ? data.clubMap[f.away_id]?.name : "TBC";
      return `${fmtDate(f.date)} · ${home} v ${away}${f.venue ? " · " + f.venue : ""}`;
    });
  const leader = data.standings[0];
  if (leader) items.unshift(`Leaders: ${leader.club.name} · ${leader.pts} pts`);
  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden border-t border-primary-foreground/10 bg-[oklch(0.16_0.08_320)]">
      <div className="ticker-track flex w-max gap-8 py-2">
        {loop.map((t, i) => (
          <span key={i} className="eyebrow whitespace-nowrap text-primary-foreground/70">
            <span className="mr-2 text-mint">●</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { data } = useQuery(leagueQuery);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 pitch-panel pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-[var(--gradient-accent)] font-display text-xs font-black tracking-tight text-accent-foreground sm:h-11 sm:w-11 sm:text-sm">
            MPL
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-[0.7rem] font-extrabold uppercase tracking-tight sm:text-base">
              Mtwapa Premier League
            </span>
            <span className="eyebrow mt-1 hidden text-primary-foreground/60 sm:block">
              {data?.seasonLabel ?? "Season 2026"}
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-sm px-3 py-2 font-display text-[0.78rem] font-bold uppercase tracking-wide transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <InstallAppButton className="ml-auto hidden shrink-0 sm:inline-flex lg:ml-2" />

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-primary-foreground/20 text-primary-foreground sm:h-10 sm:w-10 lg:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-primary-foreground/10 px-3 pb-4 pt-2 sm:px-4 lg:hidden">
          <div className="px-3 pb-1 pt-1 sm:hidden">
            <InstallAppButton className="w-full justify-center" />
          </div>
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="rounded-sm px-3 py-2.5 font-display text-sm font-bold uppercase text-primary-foreground/80 hover:bg-primary-foreground/10"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}

      <Ticker />
    </header>
  );
}