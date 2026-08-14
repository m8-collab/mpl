import { Link } from "@tanstack/react-router";
import { ClubBadge } from "./ClubBadge";
import { fmtDate, type Club, type Fixture, type LeagueData } from "@/lib/league";

export function MatchCard({ fixture, data }: { fixture: Fixture; data: LeagueData }) {
  const home = fixture.home_id ? data.clubMap[fixture.home_id] : undefined;
  const away = fixture.away_id ? data.clubMap[fixture.away_id] : undefined;
  const played = fixture.home_score !== null && fixture.away_score !== null;

  return (
    <article className="surface-card p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-muted-foreground">{fmtDate(fixture.date)}</span>
        <span className="eyebrow text-accent">{played ? "FT" : (fixture.kickoff ?? "TBC")}</span>
      </div>
      <div className="mt-3 grid gap-2">
        <Row club={home} score={fixture.home_score} />
        <Row club={away} score={fixture.away_score} />
      </div>
      {fixture.venue && <p className="mt-3 text-xs text-muted-foreground">{fixture.venue}</p>}
    </article>
  );
}

function Row({ club, score }: { club?: Club | undefined; score: number | null }) {
  const body = (
    <span className="flex items-center gap-2">
      <ClubBadge club={club} size={24} />
      <span className="truncate text-sm font-semibold">{club?.name ?? "TBC"}</span>
    </span>
  );
  return (
    <div className="flex items-center justify-between gap-3">
      {club ? (
        <Link to="/clubs/$clubId" params={{ clubId: club.id }} className="min-w-0 hover:text-accent">
          {body}
        </Link>
      ) : (
        body
      )}
      <span className="font-display text-base font-extrabold tabular-nums">{score ?? "–"}</span>
    </div>
  );
}