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
  pts_adjustment: number;
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
  match_official: string | null;
  man_of_the_match: string | null;
  home_lineup: string | null;
  away_lineup: string | null;
};

export type CardType = "yellow" | "red";

export type CardEntry = {
  id: number;
  fixture_id: string | null;
  club_id: string | null;
  player_name: string;
  card_type: CardType;
  red_via_two_yellows: boolean;
  created_at: string;
};

export type Sponsor = {
  id: number;
  name: string;
  logo_url: string | null;
  link: string | null;
  sort_order: number;
};

/**
 * A player's disciplinary standing, derived from `cards`.
 *
 * Standard football convention (flipped from the original rule-book
 * reading, which had these reversed):
 *  - 5 yellow cards picked up across the season triggers a 1-match ban.
 *  - Any red card (direct, or via a 2nd yellow in the same match)
 *    triggers a 3-match ban.
 */
export type PlayerDiscipline = {
  playerName: string;
  clubId: string | null;
  yellowCount: number;
  redCount: number;
  banMatches: number;
  banReason: string | null;
};

const YELLOW_THRESHOLD = 5;
const YELLOW_BAN_MATCHES = 1;
const RED_BAN_MATCHES = 3;

export function computeDiscipline(cards: CardEntry[]): PlayerDiscipline[] {
  const byPlayer = new Map<string, PlayerDiscipline>();
  for (const c of cards) {
    const key = `${c.club_id ?? ""}::${c.player_name}`;
    const entry = byPlayer.get(key) ?? {
      playerName: c.player_name,
      clubId: c.club_id,
      yellowCount: 0,
      redCount: 0,
      banMatches: 0,
      banReason: null,
    };
    if (c.card_type === "yellow") entry.yellowCount += 1;
    if (c.card_type === "red") entry.redCount += 1;
    byPlayer.set(key, entry);
  }

  for (const entry of byPlayer.values()) {
    if (entry.redCount > 0) {
      entry.banMatches = RED_BAN_MATCHES;
      entry.banReason = `Red card — ${RED_BAN_MATCHES}-match ban`;
    } else if (entry.yellowCount >= YELLOW_THRESHOLD) {
      entry.banMatches = YELLOW_BAN_MATCHES;
      entry.banReason = `${YELLOW_THRESHOLD} yellow cards — ${YELLOW_BAN_MATCHES}-match ban`;
    }
  }

  return [...byPlayer.values()].sort(
    (a, b) => b.banMatches - a.banMatches || b.yellowCount + b.redCount - (a.yellowCount + a.redCount),
  );
}

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
  fixture_id: string | null;
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
  editionLabel: string;
  socialLinks: { facebook: string | null; instagram: string | null; twitter: string | null; whatsapp: string | null };
  clubs: Club[];
  clubMap: Record<string, Club>;
  standings: Standing[];
  fixtures: Fixture[];
  scorers: Scorer[];
  squads: Record<string, SquadPlayer[]>;
  news: NewsItem[];
  albums: Album[];
  photos: Photo[];
  cards: CardEntry[];
  discipline: PlayerDiscipline[];
  sponsors: Sponsor[];
};

export async function fetchLeague(): Promise<LeagueData> {
  const [
    clubsRes,
    rowsRes,
    fixturesRes,
    scorersRes,
    squadsRes,
    newsRes,
    albumsRes,
    photosRes,
    settingsRes,
    cardsRes,
    sponsorsRes,
  ] = await Promise.all([
    supabase.from("clubs").select("*").order("name"),
    supabase.from("table_rows").select("*"),
    supabase.from("fixtures").select("*").order("date"),
    supabase.from("scorers").select("*").order("goals", { ascending: false }),
    supabase.from("squads").select("*").order("jersey_no"),
    supabase.from("news").select("*").order("created_at", { ascending: false }),
    supabase.from("albums").select("*").order("sort_order"),
    supabase.from("gallery").select("*").order("sort_order"),
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("cards").select("*").order("created_at", { ascending: false }),
    supabase.from("sponsors").select("*").order("sort_order"),
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
      pts: r.w * 3 + r.d + (r.pts_adjustment ?? 0),
      rank: 0,
    }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.club.name.localeCompare(b.club.name))
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const squads: Record<string, SquadPlayer[]> = {};
  ((squadsRes.data ?? []) as SquadPlayer[]).forEach((p) => {
    if (!p.club_id) return;
    (squads[p.club_id] ??= []).push(p);
  });

  const cards = (cardsRes.data ?? []) as CardEntry[];

  return {
    seasonLabel: settingsRes.data?.season_label ?? "Season 2026",
    asOfLabel: settingsRes.data?.as_of_label ?? "",
    editionLabel: settingsRes.data?.edition_label ?? "5th Edition",
    socialLinks: {
      facebook: settingsRes.data?.facebook_url ?? null,
      instagram: settingsRes.data?.instagram_url ?? null,
      twitter: settingsRes.data?.twitter_url ?? null,
      whatsapp: settingsRes.data?.whatsapp_url ?? null,
    },
    clubs,
    clubMap,
    standings,
    fixtures: (fixturesRes.data ?? []) as Fixture[],
    scorers: (scorersRes.data ?? []) as Scorer[],
    squads,
    news: (newsRes.data ?? []) as NewsItem[],
    albums: (albumsRes.data ?? []) as Album[],
    photos: (photosRes.data ?? []) as Photo[],
    cards,
    discipline: computeDiscipline(cards),
    sponsors: (sponsorsRes.data ?? []) as Sponsor[],
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