import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ClubBadge } from "./ClubBadge";
import type { Standing } from "@/lib/league";

export function StandingsTable({ rows, compact = false }: { rows: Standing[]; compact?: boolean }) {
  const total = rows.length;
  return (
    <div className="surface-card overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="pitch-panel text-left">
            <th className="eyebrow px-3 py-3 font-semibold">#</th>
            <th className="eyebrow px-2 py-3 font-semibold">Club</th>
            {!compact && (
              <>
                <th className="eyebrow px-2 py-3 text-center font-semibold">P</th>
                <th className="eyebrow px-2 py-3 text-center font-semibold">W</th>
                <th className="eyebrow px-2 py-3 text-center font-semibold">D</th>
                <th className="eyebrow px-2 py-3 text-center font-semibold">L</th>
                <th className="eyebrow px-2 py-3 text-center font-semibold">GF</th>
                <th className="eyebrow px-2 py-3 text-center font-semibold">GA</th>
              </>
            )}
            <th className="eyebrow px-2 py-3 text-center font-semibold">GD</th>
            <th className="eyebrow px-3 py-3 text-center font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.club_id} className="border-t border-border hover:bg-secondary/60">
              <td className="px-3 py-2">
                <span
                  className={cn(
                    "inline-block w-6 border-l-4 pl-2 font-display text-xs font-bold tabular-nums",
                    r.rank <= 3
                      ? "border-mint"
                      : r.rank > total - 3
                        ? "border-destructive"
                        : "border-transparent",
                  )}
                >
                  {r.rank}
                </span>
              </td>
              <td className="px-2 py-2">
                <Link
                  to="/clubs/$clubId"
                  params={{ clubId: r.club_id }}
                  className="flex items-center gap-2 font-semibold hover:text-accent"
                >
                  <ClubBadge club={r.club} size={32} />
                  <span className="truncate">{r.club.name}</span>
                </Link>
              </td>
              {!compact && (
                <>
                  <td className="px-2 py-2 text-center tabular-nums">{r.p}</td>
                  <td className="px-2 py-2 text-center tabular-nums">{r.w}</td>
                  <td className="px-2 py-2 text-center tabular-nums">{r.d}</td>
                  <td className="px-2 py-2 text-center tabular-nums">{r.l}</td>
                  <td className="px-2 py-2 text-center tabular-nums">{r.gf}</td>
                  <td className="px-2 py-2 text-center tabular-nums">{r.ga}</td>
                </>
              )}
              <td className="px-2 py-2 text-center tabular-nums">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td className="px-3 py-2 text-center font-display font-extrabold tabular-nums">{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}