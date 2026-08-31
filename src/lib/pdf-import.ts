import type { Club } from "@/lib/league";

/* ------------------------------------------------------------------ */
/* PDF text extraction                                                */
/* ------------------------------------------------------------------ */

/**
 * Extracts raw text from a PDF, page by page, using pdf.js. Only works
 * for text-based PDFs (a typed fixture list, a table exported to PDF,
 * etc) — a scanned/photographed page has no text layer and will come
 * back empty. There's no OCR fallback here; if that's what you're
 * uploading, this will need to be extended.
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;

  const lines: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    // Group text items into rough lines by their vertical position —
    // pdf.js gives every word/fragment as a separate positioned item,
    // not pre-joined lines.
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items as any[]) {
      if (!("str" in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x, str: item.str });
    }
    const sortedYs = Array.from(rows.keys()).sort((a, b) => b - a);
    for (const y of sortedYs) {
      const rowItems = rows.get(y)!.sort((a, b) => a.x - b.x);
      lines.push(rowItems.map((r) => r.str).join(" ").replace(/\s+/g, " ").trim());
    }
  }
  return lines.filter(Boolean).join("\n");
}

/* ------------------------------------------------------------------ */
/* Club name matching                                                 */
/* ------------------------------------------------------------------ */

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Finds the best-matching club for a chunk of text, by checking whether
 * the normalized club name (or its id/slug) appears as a substring, or
 * vice versa for short abbreviations. Returns null below a low
 * confidence bar rather than guessing — the review table is where a
 * human makes the final call.
 */
function matchClub(text: string, clubs: Club[]): Club | null {
  const t = normalize(text);
  if (t.length < 3) return null;

  let best: { club: Club; score: number } | null = null;
  for (const club of clubs) {
    const name = normalize(club.name);
    const id = normalize(club.id);
    let score = 0;
    if (t === name || t === id) score = 100;
    else if (t.includes(name) || name.includes(t)) score = 80;
    else if (t.includes(id) || id.includes(t)) score = 70;
    if (score > 0 && (!best || score > best.score)) best = { club, score };
  }
  return best?.club ?? null;
}

/* ------------------------------------------------------------------ */
/* Fixture parsing                                                    */
/* ------------------------------------------------------------------ */

export type ParsedFixture = {
  key: string;
  date: string | null; // yyyy-mm-dd
  kickoff: string | null; // HH:MM
  homeClubId: string | null;
  awayClubId: string | null;
  homeLabel: string; // raw matched text, shown if no club id found
  awayLabel: string;
  venue: string | null;
  sourceLine: string;
};

const DATE_PATTERNS: [RegExp, (m: RegExpMatchArray) => string | null][] = [
  // 2026-08-21 or 2026/08/21
  [/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/, (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`],
  // 21-08-2026 or 21/08/2026
  [/\b(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b/, (m) => `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`],
  // 21 August 2026 / 21 Aug 2026
  [
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(20\d{2})\b/i,
    (m) => {
      const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
      const mi = months.indexOf(m[2].toLowerCase().slice(0, 3));
      if (mi < 0) return null;
      return `${m[3]}-${String(mi + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    },
  ],
];

const TIME_PATTERN = /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i;

function extractDate(line: string): string | null {
  for (const [re, fn] of DATE_PATTERNS) {
    const m = line.match(re);
    if (m) {
      const d = fn(m);
      if (d) return d;
    }
  }
  return null;
}

function extractTime(line: string): string | null {
  const m = line.match(TIME_PATTERN);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const min = m[2];
  const ampm = m[3]?.toLowerCase();
  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${min}`;
}

// Splits a line into "left vs right" style team text: handles "v", "vs",
// "vs.", "-", or a stray line where the venue is easiest to isolate.
const VS_SPLIT = /\s+(?:vs\.?|v\.?|-|–)\s+/i;

export function parseFixturesFromText(text: string, clubs: Club[]): ParsedFixture[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const results: ParsedFixture[] = [];
  let carryDate: string | null = null;

  lines.forEach((line, idx) => {
    const lineDate = extractDate(line);
    if (lineDate) carryDate = lineDate;

    if (!VS_SPLIT.test(line)) return; // not a fixture line
    const [leftRaw, ...restParts] = line.split(VS_SPLIT);
    const rightRaw = restParts.join(" vs ");
    if (!leftRaw || !rightRaw) return;

    // Strip date/time text out of the team chunks before matching
    const strip = (s: string) =>
      s
        .replace(TIME_PATTERN, "")
        .replace(/\b(20\d{2})[-/]\d{1,2}[-/]\d{1,2}\b/, "")
        .replace(/\b\d{1,2}[-/]\d{1,2}[-/]20\d{2}\b/, "")
        .trim();

    const homeText = strip(leftRaw);
    const awayText = strip(rightRaw.split(/\s{2,}|\t/)[0] ?? rightRaw);

    const homeClub = matchClub(homeText, clubs);
    const awayClub = matchClub(awayText, clubs);
    const time = extractTime(line);

    // Very light venue guess: text after the away team name, if any real
    // words remain once known content is stripped out.
    let venue: string | null = null;
    const venueGuess = rightRaw
      .replace(awayText, "")
      .replace(TIME_PATTERN, "")
      .replace(/\bat\b/i, "")
      .trim();
    if (venueGuess.length > 2) venue = venueGuess;

    results.push({
      key: `f${idx}`,
      date: lineDate ?? carryDate,
      kickoff: time,
      homeClubId: homeClub?.id ?? null,
      awayClubId: awayClub?.id ?? null,
      homeLabel: homeClub?.name ?? homeText,
      awayLabel: awayClub?.name ?? awayText,
      venue,
      sourceLine: line,
    });
  });

  return results;
}

/* ------------------------------------------------------------------ */
/* Scorer parsing                                                     */
/* ------------------------------------------------------------------ */

export type ParsedScorer = {
  key: string;
  playerName: string;
  clubId: string | null;
  clubLabel: string;
  goals: number | null;
  sourceLine: string;
};

// A scorer line is typically "Player Name   Club Name   3" — player
// name first, club somewhere in the middle, a small integer (goal
// count) trailing. We anchor on the trailing number and the club match,
// and treat whatever's left before the club as the player name.
export function parseScorersFromText(text: string, clubs: Club[]): ParsedScorer[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const results: ParsedScorer[] = [];

  lines.forEach((line, idx) => {
    const trailingNum = line.match(/(\d{1,2})\s*$/);
    if (!trailingNum) return;
    const goals = parseInt(trailingNum[1], 10);
    if (goals > 60) return; // guards against picking up a stray year/date fragment

    const withoutGoals = line.slice(0, trailingNum.index).trim();
    if (!withoutGoals) return;

    // Try matching each known club against the line; take the best hit,
    // then whatever's left (roughly) is the player name.
    let bestClub: Club | null = null;
    let bestScore = 0;
    let matchedFragment = "";
    for (const club of clubs) {
      const name = normalize(club.name);
      const norm = normalize(withoutGoals);
      if (norm.includes(name) && name.length > bestScore) {
        bestScore = name.length;
        bestClub = club;
        matchedFragment = club.name;
      }
    }

    let playerName = withoutGoals;
    if (bestClub) {
      // Remove the matched club text (case-insensitively) from the line
      // to isolate the player name — imperfect but good enough for a
      // reviewable first pass.
      const re = new RegExp(matchedFragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      playerName = withoutGoals.replace(re, "").replace(/[-–,]\s*$/, "").trim();
    }
    if (!playerName || playerName.length < 2) return;

    results.push({
      key: `s${idx}`,
      playerName,
      clubId: bestClub?.id ?? null,
      clubLabel: bestClub?.name ?? "",
      goals,
      sourceLine: line,
    });
  });

  return results;
}

/* ------------------------------------------------------------------ */
/* Squad parsing                                                       */
/* ------------------------------------------------------------------ */

export type ParsedSquadPlayer = {
  key: string;
  playerName: string;
  clubId: string | null;
  clubLabel: string;
  position: string | null;
  sourceLine: string;
};

const POSITION_PATTERNS: [RegExp, string][] = [
  [/\b(goalkeeper|goalkeepers|gk)\b/i, "Goalkeeper"],
  [/\b(defenders?|def|cb|rb|lb|centre[- ]?back|full[- ]?back)\b/i, "Defender"],
  [/\b(midfielders?|mid|cm|cdm|cam|dm|am)\b/i, "Midfielder"],
  [/\b(forwards?|fwd|strikers?|st|wingers?|lw|rw)\b/i, "Forward"],
];

function matchClubHeading(line: string, clubs: Club[]): Club | null {
  const norm = normalize(line);
  if (norm.length < 3 || norm.length > 40) return null; // headings are short — long lines are player rows
  for (const club of clubs) {
    if (norm === normalize(club.name) || norm === normalize(club.id)) return club;
  }
  return null;
}

/**
 * Parses either a single-club roster (use defaultClubId for every player)
 * or a multi-club document where each club's section starts with a
 * heading line matching one of the known club names — whichever the
 * source PDF actually looks like. A heading found mid-document switches
 * which club subsequent rows are attributed to.
 */
export function parseSquadsFromText(text: string, clubs: Club[], defaultClubId?: string): ParsedSquadPlayer[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const results: ParsedSquadPlayer[] = [];
  let currentClub: Club | null = clubs.find((c) => c.id === defaultClubId) ?? null;

  lines.forEach((line, idx) => {
    const heading = matchClubHeading(line, clubs);
    if (heading) {
      currentClub = heading;
      return;
    }

    let position: string | null = null;
    let nameOnly = line;
    for (const [re, label] of POSITION_PATTERNS) {
      if (re.test(line)) {
        position = label;
        nameOnly = line.replace(re, "").trim();
        break;
      }
    }
    // Strip a leading jersey number ("7. Name", "12 - Name") and trailing
    // separators left over once the position keyword is removed.
    nameOnly = nameOnly
      .replace(/^\d+\s*[.)\-:]\s*/, "")
      .replace(/[-–,:]\s*$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!nameOnly || nameOnly.length < 2 || /^\d+$/.test(nameOnly)) return;

    results.push({
      key: `sq${idx}`,
      playerName: nameOnly,
      clubId: currentClub?.id ?? null,
      clubLabel: currentClub?.name ?? "",
      position,
      sourceLine: line,
    });
  });

  return results;
}
