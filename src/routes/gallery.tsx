import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { leagueQuery } from "@/lib/league";
import { PageHeader } from "@/components/league/PageHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery | Mtwapa Premier League" },
      { name: "description", content: "Matchday photography from Mtwapa Premier League grounds: goals, celebrations and the crowds." },
      { property: "og:title", content: "Mtwapa Premier League Gallery" },
      { property: "og:description", content: "Matchday photos from across the league." },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { data } = useQuery(leagueQuery);
  const [album, setAlbum] = useState<number | "all">("all");
  const photos = (data?.photos ?? []).filter((p) => album === "all" || p.album_id === album);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader eyebrow="Matchday" title="Gallery" />
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterButton active={album === "all"} onClick={() => setAlbum("all")} label="All photos" />
        {data?.albums.map((a) => (
          <FilterButton key={a.id} active={album === a.id} onClick={() => setAlbum(a.id)} label={a.name} />
        ))}
      </div>
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
        {photos.map((p) => (
          <figure key={p.id} className="surface-card mb-3 break-inside-avoid overflow-hidden">
            <img src={p.url} alt={p.caption ?? "Matchday photo"} loading="lazy" className="w-full object-cover" />
            {p.caption && <figcaption className="p-3 text-xs text-muted-foreground">{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {!photos.length && <p className="text-sm text-muted-foreground">No photos in this album yet.</p>}
    </div>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-sm border px-3 py-2 font-display text-xs font-bold uppercase tracking-wide",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}