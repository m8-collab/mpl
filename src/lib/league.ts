import { supabase } from "@/integrations/supabase/client";

export type Club = {
  id: string;
  name: string;
  venue: string | null;
  crest_url: string | null;
};

export type TableRowRaw = {
  club_id: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
};

export type Standing = TableRowRaw & {
  club: Club;
  gd: number;
  pts: number;
  rank: number;
};

export type Fixture = {
  id: string;
  match_no: string | null;
  date: string;
  home_id: string | null;
  away_id: string | null;
  venue: string | null;
  kickoff: string | null;
  home_score: number | null;
  away_score: number | null;
};

export type Scorer = {
  id: number;
  player_name: string;
  club_id: string | null;
  goals: number;
};

export type SquadPlayer = {
  id: number;
  club_id: string | null;
  player_name: string;
  jersey_no: number | null;
  photo_url: string | null;
};

export type NewsItem = {
  id: number;
  tag: string | null;
  title: string;
  body: string | null;
};

export type Album = {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
};

export type Photo = {
  id: number;
  url: string;
  caption: string | null;
  album_id: number | null;
  sort_order: number;
};

export type LeagueData = {
  seasonLabel: string;
  asOfLabel: string;
  clubs: Club[];
  clubMap: Record<string, Club>;
  standings: Standing[];
  fixtures: Fixture[];
  scorers: Scorer[];
  squads: Record<string, SquadPlayer[]>;
  news: NewsItem[];
  albums: Album[];
  photos: Photo[];
};

export async function fetchLeague(): Promise<LeagueData> {
  const [clubsRes, rowsRes, fixturesRes, scorersRes, squadsRes, newsRes, albumsRes, photosRes, settingsRes] =
    await Promise.all([
      supabase.from("clubs").select("*").order("name"),
      supabase.from("table_rows").select("*"),
      supabase.from("fixtures").select("*").order("date"),
      supabase.from("scorers").select("*").order("goals", { ascending: false }),
      supabase.from("squads").select("*").order("jersey_no"),
      supabase.from("news").select("*").order("created_at", { ascending: false }),
      supabase.from("albums").select("*").order("sort_order"),
      supabase.from("gallery").select("*").order("sort_order"),
      supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    ]);

  const clubs = (clubsRes.data ?? []) as Club[];
  const clubMap: Record<string, Club> = {};
  clubs.forEach((c) => (clubMap[c.id] = c));

  const standings = ((rowsRes.data ?? []) as TableRowRaw[])
    .filter((r) => clubMap[r.club_id])
    .map((r) => ({
      ...r,
      club: clubMap[r.club_id]!,
      gd: r.gf - r.ga,
      pts: r.w * 3 + r.d,
      rank: 0,
    }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.club.name.localeCompare(b.club.name))
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const squads: Record<string, SquadPlayer[]> = {};
  ((squadsRes.data ?? []) as SquadPlayer[]).forEach((p) => {
    if (!p.club_id) return;
    (squads[p.club_id] ??= []).push(p);
  });

  return {
    seasonLabel: settingsRes.data?.season_label ?? "Season 2026",
    asOfLabel: settingsRes.data?.as_of_label ?? "",
    clubs,
    clubMap,
    standings,
    fixtures: (fixturesRes.data ?? []) as Fixture[],
    scorers: (scorersRes.data ?? []) as Scorer[],
    squads,
    news: (newsRes.data ?? []) as NewsItem[],
    albums: (albumsRes.data ?? []) as Album[],
    photos: (photosRes.data ?? []) as Photo[],
  };
}

export const leagueQuery = {
  queryKey: ["league"] as const,
  queryFn: fetchLeague,
  staleTime: 60_000,
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function isPlayed(f: Fixture) {
  return f.home_score !== null && f.away_score !== null;
}

export function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function fmtLongDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"] as const;
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function zoneFor(rank: number, total: number) {
  if (rank <= 3) return "top" as const;
  if (rank > total - 3) return "bottom" as const;
  return "none" as const;
}