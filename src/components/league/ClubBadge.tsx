import { cn } from "@/lib/utils";
import { initials, type Club } from "@/lib/league";

export function ClubBadge({
  club,
  size = 32,
  className,
}: {
  club?: Club | undefined;
  size?: number;
  className?: string | undefined;
}) {
  if (!club) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-bold text-primary",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.32)) }}
    >
      {club.crest_url ? (
        <img src={club.crest_url} alt={`${club.name} crest`} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        initials(club.name)
      )}
    </span>
  );
}