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
  postponed: boolean;
  postponed_note: string | null;
  season: string | null;
  live: boolean;
  assigned_official_id: string | null;
};

export type CardType = "yellow" | "red";

export type CardEntry = {
  id: number;
  fixture_id: string | null;
  club_id: string | null;
  player_name: string;
  card_type: CardType;
  red_via_two_yellows: boolean;
  foul_reason: string | null;
  created_at: string;
};

export type GoalEntry = {
  id: number;
  fixture_id: string | null;
  club_id: string | null;
  player_name: string;
  minute: number | null;
  created_at: string;
};

export type Sponsor = {
  id: number;
  name: string;
  logo_url: string | null;
  link: string | null;
  sort_order: number;
};

/** Contact-form submissions — admin-only, never included in the public
 *  league fetch (see fetchInquiries() instead, used only from /admin). */
export type Inquiry = {
  id: number;
  name: string;
  phone: string;
  club_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
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

export type DisciplineRules = { yellowThreshold: number; yellowBanMatches: number; redBanMatches: number };
export const DEFAULT_DISCIPLINE_RULES: DisciplineRules = {
  yellowThreshold: YELLOW_THRESHOLD,
  yellowBanMatches: YELLOW_BAN_MATCHES,
  redBanMatches: RED_BAN_MATCHES,
};

export function actualResult(f: Fixture): "home" | "draw" | "away" | null {
  if (f.postponed || f.home_score === null || f.away_score === null) return null;
  if (f.home_score > f.away_score) return "home";
  if (f.home_score < f.away_score) return "away";
  return "draw";
}

export type PredictorLeaderboardRow = { name: string; phone: string; correct: number; total: number };

export function computePredictorLeaderboard(predictions: Prediction[], fixtures: Fixture[]): PredictorLeaderboardRow[] {
  const fixtureMap = new Map(fixtures.map((f) => [f.id, f]));
  const byPhone = new Map<string, PredictorLeaderboardRow>();
  predictions.forEach((p) => {
    const fixture = p.fixture_id ? fixtureMap.get(p.fixture_id) : undefined;
    if (!fixture) return;
    const result = actualResult(fixture);
    if (result === null) return; // fixture not played (or postponed) yet — doesn't count either way
    const row = byPhone.get(p.phone) ?? { name: p.name, phone: p.phone, correct: 0, total: 0 };
    row.total += 1;
    if (result === p.pick) row.correct += 1;
    byPhone.set(p.phone, row);
  });
  return Array.from(byPhone.values()).sort((a, b) => b.correct - a.correct || b.total - a.total);
}

export function computeDiscipline(cards: CardEntry[], rules: DisciplineRules = DEFAULT_DISCIPLINE_RULES): PlayerDiscipline[] {
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
      entry.banMatches = rules.redBanMatches;
      entry.banReason = `Red card — ${rules.redBanMatches}-match ban`;
    } else if (entry.yellowCount >= rules.yellowThreshold) {
      entry.banMatches = rules.yellowBanMatches;
      entry.banReason = `${rules.yellowThreshold} yellow cards — ${rules.yellowBanMatches}-match ban`;
    }
  }

  return [...byPlayer.values()].sort(
    (a, b) => b.banMatches - a.banMatches || b.yellowCount + b.redCount - (a.yellowCount + a.redCount),
  );
}

export type Appearance = {
  id: number;
  fixture_id: string | null;
  club_id: string | null;
  player_name: string;
  started: boolean;
  subbed_on_minute: number | null;
  subbed_off_minute: number | null;
};

export type SuspensionStatus = PlayerDiscipline & {
  matchesServed: number;
  matchesRemaining: number;
  suspended: boolean;
};

/**
 * Unlike computeDiscipline() (season totals, used for the public
 * Discipline page), this tracks whether a ban has actually been SERVED —
 * a match counts as served only if the player has no appearance record
 * for it (or one where they never came on). If they were selected
 * anyway (an official can warn-and-allow, not hard block), that match
 * does not count toward serving the ban.
 */
export function computeSuspensions(
  cards: CardEntry[],
  fixtures: Fixture[],
  appearances: Appearance[],
  rules: DisciplineRules = DEFAULT_DISCIPLINE_RULES,
): SuspensionStatus[] {
  const fixtureMap = new Map(fixtures.map((f) => [f.id, f]));
  const base = computeDiscipline(cards, rules);

  const cardsByPlayer = new Map<string, CardEntry[]>();
  cards.forEach((c) => {
    const key = `${c.club_id ?? ""}::${c.player_name}`;
    cardsByPlayer.set(key, [...(cardsByPlayer.get(key) ?? []), c]);
  });

  return base.map((entry) => {
    if (entry.banMatches === 0) {
      return { ...entry, matchesServed: 0, matchesRemaining: 0, suspended: false };
    }

    const key = `${entry.clubId ?? ""}::${entry.playerName}`;
    const playerCards = (cardsByPlayer.get(key) ?? [])
      .map((c) => ({ ...c, fixture: c.fixture_id ? fixtureMap.get(c.fixture_id) : undefined }))
      .filter((c) => c.fixture)
      .sort((a, b) => a.fixture!.date.localeCompare(b.fixture!.date));

    let triggerDate: string | null = null;
    const redCard = playerCards.find((c) => c.card_type === "red");
    if (redCard) {
      triggerDate = redCard.fixture!.date;
    } else {
      const yellows = playerCards.filter((c) => c.card_type === "yellow");
      if (yellows.length >= rules.yellowThreshold) triggerDate = yellows[rules.yellowThreshold - 1].fixture!.date;
    }
    if (!triggerDate) return { ...entry, matchesServed: 0, matchesRemaining: entry.banMatches, suspended: true };

    const clubId = entry.clubId;
    const subsequentPlayed = fixtures
      .filter(
        (f) =>
          (f.home_id === clubId || f.away_id === clubId) &&
          f.date > triggerDate! &&
          !f.postponed &&
          f.home_score !== null &&
          f.away_score !== null,
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    let served = 0;
    for (const f of subsequentPlayed) {
      if (served >= entry.banMatches) break;
      const appeared = appearances.some(
        (a) => a.fixture_id === f.id && a.club_id === clubId && a.player_name === entry.playerName && (a.started || a.subbed_on_minute !== null),
      );
      if (!appeared) served += 1;
    }
    const remaining = Math.max(0, entry.banMatches - served);
    return { ...entry, matchesServed: served, matchesRemaining: remaining, suspended: remaining > 0 };
  });
}

export type Scorer = {
  id: number;
  player_name: string;
  club_id: string | null;
  goals: number;
  season: string | null;
};

export type SquadPlayer = {
  id: number;
  club_id: string | null;
  player_name: string;
  position: string | null;
  photo_url: string | null;
};

export type NewsItem = {
  id: number;
  tag: string | null;
  title: string;
  body: string | null;
  image_url: string | null;
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

export type Prediction = {
  id: number;
  fixture_id: string | null;
  name: string;
  phone: string;
  pick: "home" | "draw" | "away";
  created_at: string;
};

export type LeagueData = {
  seasonLabel: string;
  asOfLabel: string;
  editionLabel: string;
  socialLinks: { facebook: string | null; instagram: string | null; twitter: string | null; whatsapp: string | null };
  disciplineRules: DisciplineRules;
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
  goals: GoalEntry[];
  discipline: PlayerDiscipline[];
  appearances: Appearance[];
  suspensions: SuspensionStatus[];
  sponsors: Sponsor[];
  predictions: Prediction[];
  seasons: string[];
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
    predictionsRes,
    appearancesRes,
    goalsRes,
  ] = await Promise.all([
    supabase.from("clubs").select("*").order("name"),
    supabase.from("table_rows").select("*"),
    supabase.from("fixtures").select("*").order("date"),
    supabase.from("scorers").select("*").order("goals", { ascending: false }),
    supabase.from("squads").select("*").order("player_name"),
    supabase.from("news").select("*").order("created_at", { ascending: false }),
    supabase.from("albums").select("*").order("sort_order"),
    supabase.from("gallery").select("*").order("sort_order"),
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("cards").select("*").order("created_at", { ascending: false }),
    supabase.from("sponsors").select("*").order("sort_order"),
    supabase.from("predictions").select("*").order("created_at", { ascending: false }),
    supabase.from("appearances").select("*"),
    supabase.from("goals").select("*").order("created_at", { ascending: false }),
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
  const fixtures = (fixturesRes.data ?? []) as Fixture[];
  const scorers = (scorersRes.data ?? []) as Scorer[];
  const appearances = (appearancesRes.data ?? []) as Appearance[];
  const disciplineRules: DisciplineRules = {
    yellowThreshold: settingsRes.data?.yellow_threshold ?? DEFAULT_DISCIPLINE_RULES.yellowThreshold,
    yellowBanMatches: settingsRes.data?.yellow_ban_matches ?? DEFAULT_DISCIPLINE_RULES.yellowBanMatches,
    redBanMatches: settingsRes.data?.red_ban_matches ?? DEFAULT_DISCIPLINE_RULES.redBanMatches,
  };
  const seasons = Array.from(
    new Set([...fixtures.map((f) => f.season), ...scorers.map((s) => s.season)].filter((s): s is string => !!s)),
  ).sort();

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
    disciplineRules,
    clubs,
    clubMap,
    standings,
    fixtures,
    scorers,
    squads,
    news: (newsRes.data ?? []) as NewsItem[],
    albums: (albumsRes.data ?? []) as Album[],
    photos: (photosRes.data ?? []) as Photo[],
    cards,
    goals: (goalsRes.data ?? []) as GoalEntry[],
    discipline: computeDiscipline(cards, disciplineRules),
    appearances,
    suspensions: computeSuspensions(cards, fixtures, appearances, disciplineRules),
    sponsors: (sponsorsRes.data ?? []) as Sponsor[],
    predictions: (predictionsRes.data ?? []) as Prediction[],
    seasons,
  };
}

/** Admin-only — never bundled into the public league fetch (RLS also
 *  blocks anyone but a full admin from reading these regardless). */
export async function fetchInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Inquiry[];
}

export const leagueQuery = {
  queryKey: ["league"] as const,
  queryFn: fetchLeague,
  staleTime: 60_000,
};

/** Poll faster only while at least one fixture is genuinely live — avoids
 *  hammering the database on pages/visitors when nothing is happening. */
export const liveRefetchInterval = (query: { state: { data?: LeagueData } }) =>
  query.state.data?.fixtures.some((f) => f.live) ? 15_000 : false;

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