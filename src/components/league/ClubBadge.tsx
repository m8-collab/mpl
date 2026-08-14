import { cn } from "@/lib/utils";
import { initials, type Club } from "@/lib/league";

export function ClubBadge({
  club,
  size = 28,
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
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-[0.62rem] font-bold text-primary",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {club.crest_url ? (
        <img src={club.crest_url} alt={`${club.name} crest`} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        initials(club.name)
      )}
    </span>
  );
}