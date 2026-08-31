import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Club, Fixture, CardEntry, CardType, SquadPlayer, SuspensionStatus, Appearance } from "@/lib/league";

type AlbumRow = { id: number; name: string; fixture_id: string | null };
type PhotoRow = { id: number; url: string; caption: string | null; album_id: number | null };

// Common on-field offenses a match official can pick from when logging a
// card, so the discipline record says WHAT happened, not just the color
// of card shown. Left open-ended via a free-text fallback for anything
// that doesn't fit these.
const FOUL_REASONS = [
  "Reckless tackle",
  "Serious foul play",
  "Handball",
  "Dissent by word or action",
  "Unsporting behaviour",
  "Denying an obvious goal-scoring opportunity",
  "Violent conduct",
  "Time wasting",
  "Persistent infringement",
];

/**
 * Everything a match official needs to file after a game, in one place:
 * result, lineups, cards, man of the match, and matchday photos — all
 * tied to a single fixture, instead of spread across separate tabs.
 */
export function MatchOfficialDashboard({
  clubs,
  fixtures,
  squads,
  suspensions,
  onChanged,
}: {
  clubs: Club[];
  fixtures: Fixture[];
  squads: Record<string, SquadPlayer[]>;
  suspensions: SuspensionStatus[];
  onChanged?: () => void;
}) {
  const clubMap = useMemo(() => {
    const m: Record<string, Club> = {};
    clubs.forEach((c) => (m[c.id] = c));
    return m;
  }, [clubs]);

  const fixtureOptions = useMemo(
    () =>
      [...fixtures]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((f) => ({
          value: f.id,
          label: `${f.match_no ? `#${f.match_no} · ` : ""}${clubMap[f.home_id ?? ""]?.name ?? "TBC"} v ${
            clubMap[f.away_id ?? ""]?.name ?? "TBC"
          } · ${f.date}`,
        })),
    [fixtures, clubMap],
  );

  const [fixtureId, setFixtureId] = useState("");
  const fixture = fixtures.find((f) => f.id === fixtureId) ?? null;
  const homeClub = fixture?.home_id ? clubMap[fixture.home_id] : undefined;
  const awayClub = fixture?.away_id ? clubMap[fixture.away_id] : undefined;

  // ---- match report form ----
  const [form, setForm] = useState({
    home_score: "",
    away_score: "",
    match_official: "",
    man_of_the_match: "",
    postponed: false,
    postponed_note: "",
  });
  const [savingReport, setSavingReport] = useState(false);

  useEffect(() => {
    if (!fixture) {
      setForm({
        home_score: "",
        away_score: "",
        match_official: "",
        man_of_the_match: "",
        postponed: false,
        postponed_note: "",
      });
      return;
    }
    setForm({
      home_score: fixture.home_score?.toString() ?? "",
      away_score: fixture.away_score?.toString() ?? "",
      match_official: fixture.match_official ?? "",
      man_of_the_match: fixture.man_of_the_match ?? "",
      postponed: fixture.postponed ?? false,
      postponed_note: fixture.postponed_note ?? "",
    });
  }, [fixture?.id]);

  async function toggleLive() {
    if (!fixture) return;
    const nextLive = !fixture.live;
    const { error } = await supabase.from("fixtures").update({ live: nextLive }).eq("id", fixture.id);
    if (error) return toast.error(error.message);
    toast.success(nextLive ? "Match is now LIVE on the site" : "Match ended — LIVE badge removed");
    onChanged?.();
  }

  async function saveReport(e: FormEvent) {
    e.preventDefault();
    if (!fixtureId) return;
    setSavingReport(true);
    const { error } = await supabase
      .from("fixtures")
      .update({
        home_score: form.postponed ? null : form.home_score === "" ? null : Number(form.home_score),
        away_score: form.postponed ? null : form.away_score === "" ? null : Number(form.away_score),
        match_official: form.match_official || null,
        man_of_the_match: form.man_of_the_match || null,
        postponed: form.postponed,
        postponed_note: form.postponed ? form.postponed_note || null : null,
        ...(form.postponed ? { live: false } : {}),
      })
      .eq("id", fixtureId);
    setSavingReport(false);
    if (error) return toast.error(error.message);
    toast.success(form.postponed ? "Match marked as postponed" : "Match report saved");
    onChanged?.();
  }

  // ---- cards for this fixture ----
  const [cards, setCards] = useState<CardEntry[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardForm, setCardForm] = useState({ club_id: "", player_name: "", card_type: "yellow" as CardType, red_via_two_yellows: false, foul_reason: "" });
  const [savingCard, setSavingCard] = useState(false);

  async function loadCards(id: string) {
    setLoadingCards(true);
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("fixture_id", id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setCards((data as CardEntry[]) ?? []);
    setLoadingCards(false);
  }

  useEffect(() => {
    if (fixtureId) loadCards(fixtureId);
    else setCards([]);
    setCardForm({ club_id: "", player_name: "", card_type: "yellow", red_via_two_yellows: false, foul_reason: "" });
  }, [fixtureId]);

  // ---- lineups (starting XI + subs) for this fixture ----
  type LineupEntry = { selected: boolean; started: boolean; subbedOnMinute: string; subbedOffMinute: string };
  const [lineup, setLineup] = useState<Record<string, LineupEntry>>({}); // keyed by `${club_id}::${player_name}`
  const [savingLineup, setSavingLineup] = useState(false);
  const suspensionMap = useMemo(
    () => new Map(suspensions.map((s) => [`${s.clubId ?? ""}::${s.playerName}`, s])),
    [suspensions],
  );

  useEffect(() => {
    if (!fixtureId) {
      setLineup({});
      return;
    }
    supabase
      .from("appearances")
      .select("*")
      .eq("fixture_id", fixtureId)
      .then(({ data }) => {
        const next: Record<string, LineupEntry> = {};
        ((data as Appearance[]) ?? []).forEach((a) => {
          next[`${a.club_id ?? ""}::${a.player_name}`] = {
            selected: true,
            started: a.started,
            subbedOnMinute: a.subbed_on_minute?.toString() ?? "",
            subbedOffMinute: a.subbed_off_minute?.toString() ?? "",
          };
        });
        setLineup(next);
      });
  }, [fixtureId]);

  function toggleLineupPlayer(clubId: string, playerName: string, started: boolean) {
    const key = `${clubId}::${playerName}`;
    const suspension = suspensionMap.get(key);
    if (suspension?.suspended) {
      const proceed = confirm(
        `${playerName} is currently suspended (${suspension.banReason ?? "active ban"}, ${suspension.matchesRemaining} match(es) remaining). Select them anyway?`,
      );
      if (!proceed) return;
    }
    setLineup((prev) => {
      const existing = prev[key];
      if (existing?.selected && existing.started === started) {
        // tapping the same state again clears the selection
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: { selected: true, started, subbedOnMinute: existing?.subbedOnMinute ?? "", subbedOffMinute: existing?.subbedOffMinute ?? "" } };
    });
  }

  function updateLineupMinute(clubId: string, playerName: string, field: "subbedOnMinute" | "subbedOffMinute", value: string) {
    const key = `${clubId}::${playerName}`;
    setLineup((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], [field]: value } } : prev));
  }

  async function saveLineup() {
    if (!fixtureId) return;
    setSavingLineup(true);
    try {
      const rows = Object.entries(lineup)
        .filter(([, v]) => v.selected)
        .map(([key, v]) => {
          const [club_id, player_name] = key.split("::");
          return {
            fixture_id: fixtureId,
            club_id,
            player_name,
            started: v.started,
            subbed_on_minute: v.subbedOnMinute === "" ? null : Number(v.subbedOnMinute),
            subbed_off_minute: v.subbedOffMinute === "" ? null : Number(v.subbedOffMinute),
          };
        });
      const { error: delErr } = await supabase.from("appearances").delete().eq("fixture_id", fixtureId);
      if (delErr) throw delErr;
      if (rows.length > 0) {
        const { error: insErr } = await supabase.from("appearances").insert(rows);
        if (insErr) throw insErr;
      }
      toast.success("Lineup saved");
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't save the lineup");
    } finally {
      setSavingLineup(false);
    }
  }

  async function addCard(e: FormEvent) {
    e.preventDefault();
    if (!fixtureId || !cardForm.club_id || !cardForm.player_name.trim()) return;
    setSavingCard(true);
    const { error } = await supabase.from("cards").insert({
      fixture_id: fixtureId,
      club_id: cardForm.club_id,
      player_name: cardForm.player_name.trim(),
      card_type: cardForm.card_type,
      red_via_two_yellows: cardForm.card_type === "red" ? cardForm.red_via_two_yellows : false,
      foul_reason: cardForm.foul_reason || null,
    });
    setSavingCard(false);
    if (error) return toast.error(error.message);
    toast.success("Card added");
    setCardForm({ club_id: "", player_name: "", card_type: "yellow", red_via_two_yellows: false, foul_reason: "" });
    await loadCards(fixtureId);
    onChanged?.();
  }

  async function deleteCard(id: number) {
    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await loadCards(fixtureId);
    onChanged?.();
  }

  // ---- matchday photo album for this fixture ----
  const [album, setAlbum] = useState<AlbumRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  async function loadAlbum(id: string) {
    setLoadingAlbum(true);
    const { data, error } = await supabase.from("albums").select("*").eq("fixture_id", id).maybeSingle();
    if (error) toast.error(error.message);
    const a = (data as AlbumRow | null) ?? null;
    setAlbum(a);
    if (a) {
      const { data: g } = await supabase.from("gallery").select("*").eq("album_id", a.id).order("sort_order");
      setPhotos((g as PhotoRow[]) ?? []);
    } else {
      setPhotos([]);
    }
    setLoadingAlbum(false);
  }

  useEffect(() => {
    if (fixtureId) loadAlbum(fixtureId);
    else {
      setAlbum(null);
      setPhotos([]);
    }
  }, [fixtureId]);

  async function ensureAlbum(): Promise<AlbumRow | null> {
    if (album) return album;
    if (!fixture) return null;
    const name = `Matchday: ${homeClub?.name ?? "TBC"} v ${awayClub?.name ?? "TBC"} (${fixture.date})`;
    const { data, error } = await supabase
      .from("albums")
      .insert({ name, fixture_id: fixture.id })
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
      return null;
    }
    const a = data as AlbumRow;
    setAlbum(a);
    return a;
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const a = await ensureAlbum();
      if (!a) throw new Error("Could not create matchday album");
      for (const file of Array.from(files)) {
        const path = `${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("gallery").upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("gallery").getPublicUrl(path);
        const { error: insErr } = await supabase.from("gallery").insert({ url: pub.publicUrl, caption: "", album_id: a.id });
        if (insErr) throw insErr;
      }
      toast.success("Matchday photos uploaded");
      setFiles(null);
      await loadAlbum(fixtureId);
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(id: number) {
    const { error } = await supabase.from("gallery").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await loadAlbum(fixtureId);
    onChanged?.();
  }

  const matchClubOptions = [homeClub, awayClub]
    .filter((c): c is Club => !!c)
    .map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base uppercase tracking-wide">Pick a match</CardTitle>
          <CardDescription>Everything for that fixture — result, official, lineups, cards, photos — lives here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={fixtureId} onValueChange={setFixtureId}>
            <SelectTrigger className="max-w-xl">
              <SelectValue placeholder="Select a fixture…" />
            </SelectTrigger>
            <SelectContent>
              {fixtureOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {fixture && (
        <>
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle className="font-display text-base uppercase tracking-wide">
                Match report — {homeClub?.name ?? "TBC"} v {awayClub?.name ?? "TBC"}
              </CardTitle>
              <Button
                type="button"
                variant={fixture.live ? "destructive" : "outline"}
                size="sm"
                onClick={toggleLive}
                disabled={fixture.postponed}
              >
                {fixture.live ? "End live match (full time)" : "Go live at kickoff"}
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveReport} className="grid gap-4">
                {fixture.live && (
                  <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                    This match is showing as LIVE on the public site right now. Update the scores below as goals go
                    in — the site refreshes automatically while a match is live. Tap "End live match" above once
                    it's full time.
                  </p>
                )}
                <label className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm">
                  <Checkbox
                    checked={form.postponed}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, postponed: v === true }))}
                  />
                  This match was postponed (no result to file)
                </label>
                {form.postponed && (
                  <div className="grid gap-1.5">
                    <Label>Reason / new date note</Label>
                    <Input
                      value={form.postponed_note}
                      onChange={(e) => setForm((f) => ({ ...f, postponed_note: e.target.value }))}
                      placeholder="e.g. Waterlogged pitch — new date to be confirmed"
                    />
                  </div>
                )}
                <div className={`grid grid-cols-2 gap-3 sm:max-w-sm ${form.postponed ? "opacity-40" : ""}`}>
                  <div className="grid gap-1.5">
                    <Label>{homeClub?.name ?? "Home"} score</Label>
                    <Input
                      type="number"
                      value={form.home_score}
                      disabled={form.postponed}
                      onChange={(e) => setForm((f) => ({ ...f, home_score: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{awayClub?.name ?? "Away"} score</Label>
                    <Input
                      type="number"
                      value={form.away_score}
                      disabled={form.postponed}
                      onChange={(e) => setForm((f) => ({ ...f, away_score: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label>Match official (referee)</Label>
                    <Input
                      value={form.match_official}
                      onChange={(e) => setForm((f) => ({ ...f, match_official: e.target.value }))}
                      placeholder="Referee name"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Man of the Match</Label>
                    <Input
                      value={form.man_of_the_match}
                      onChange={(e) => setForm((f) => ({ ...f, man_of_the_match: e.target.value }))}
                      placeholder="Player with the standout performance in this game"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="submit" disabled={savingReport}>
                    {savingReport ? "Saving…" : "Save match report"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={fixture.postponed || fixture.home_score === null || fixture.away_score === null}
                    onClick={() => {
                      const lines = [
                        `⚽ FULL TIME`,
                        `${homeClub?.name ?? "TBC"} ${fixture.home_score} - ${fixture.away_score} ${awayClub?.name ?? "TBC"}`,
                        fixture.venue ? `📍 ${fixture.venue}` : null,
                        `📅 ${fixture.date}`,
                        fixture.man_of_the_match ? `⭐ Man of the Match: ${fixture.man_of_the_match}` : null,
                        cards.length
                          ? `🟨🟥 Cards: ${cards
                              .map((c) => `${c.player_name} (${c.card_type === "red" ? "R" : "Y"})`)
                              .join(", ")}`
                          : null,
                        fixture.match_official ? `👤 Match official: ${fixture.match_official}` : null,
                      ].filter(Boolean);
                      const text = lines.join("\n");
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                  >
                    Share result on WhatsApp
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base uppercase tracking-wide">Cards</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <form onSubmit={addCard} className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-end">
                <div className="grid gap-1.5">
                  <Label>Club</Label>
                  <Select value={cardForm.club_id} onValueChange={(v) => setCardForm((c) => ({ ...c, club_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select club…" />
                    </SelectTrigger>
                    <SelectContent>
                      {matchClubOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Player</Label>
                  <Input
                    value={cardForm.player_name}
                    onChange={(e) => setCardForm((c) => ({ ...c, player_name: e.target.value }))}
                    placeholder="Player name"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Card</Label>
                  <Select
                    value={cardForm.card_type}
                    onValueChange={(v) => setCardForm((c) => ({ ...c, card_type: v as CardType }))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {cardForm.card_type === "red" && (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={cardForm.red_via_two_yellows}
                      onCheckedChange={(v) => setCardForm((c) => ({ ...c, red_via_two_yellows: v === true }))}
                    />
                    Via 2nd yellow
                  </label>
                )}
                <Button type="submit" disabled={savingCard || !cardForm.club_id || !cardForm.player_name.trim()}>
                  Add card
                </Button>
                </div>
                <div className="grid gap-1.5">
                  <Label>Foul (what happened)</Label>
                  <Select
                    value={FOUL_REASONS.includes(cardForm.foul_reason) ? cardForm.foul_reason : cardForm.foul_reason ? "Other" : ""}
                    onValueChange={(v) => setCardForm((c) => ({ ...c, foul_reason: v === "Other" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the foul…" />
                    </SelectTrigger>
                    <SelectContent>
                      {FOUL_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!FOUL_REASONS.includes(cardForm.foul_reason)) && (
                    <Input
                      value={cardForm.foul_reason}
                      onChange={(e) => setCardForm((c) => ({ ...c, foul_reason: e.target.value }))}
                      placeholder="Describe the foul"
                      className="mt-1"
                    />
                  )}
                </div>
              </form>

              {loadingCards ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : cards.length ? (
                <ul className="grid gap-2 text-sm">
                  {cards.map((c) => (
                    <li key={c.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <span>
                        <span className={c.card_type === "red" ? "font-bold text-destructive" : "font-bold text-amber-600"}>
                          {c.card_type === "red" ? "RED" : "YEL"}
                        </span>{" "}
                        {c.player_name} · {c.club_id ? clubMap[c.club_id]?.name : "—"}
                        {c.red_via_two_yellows && <span className="text-muted-foreground"> (2nd yellow)</span>}
                        {c.foul_reason && <span className="text-muted-foreground"> — {c.foul_reason}</span>}
                      </span>
                      <Button size="sm" variant="destructive" onClick={() => deleteCard(c.id)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No cards recorded for this match.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base uppercase tracking-wide">Lineups</CardTitle>
              <CardDescription>
                Pick the starting XI and any substitutes used for each side. This is what powers real suspension
                tracking — a banned player's match only counts as "served" if they have no appearance recorded here.
                Selecting a suspended player warns you first but doesn't block it, in case a ban needs correcting.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <LineupPicker
                  club={homeClub}
                  squad={homeClub ? squads[homeClub.id] ?? [] : []}
                  lineup={lineup}
                  suspensionMap={suspensionMap}
                  onToggle={toggleLineupPlayer}
                  onMinuteChange={updateLineupMinute}
                />
                <LineupPicker
                  club={awayClub}
                  squad={awayClub ? squads[awayClub.id] ?? [] : []}
                  lineup={lineup}
                  suspensionMap={suspensionMap}
                  onToggle={toggleLineupPlayer}
                  onMinuteChange={updateLineupMinute}
                />
              </div>
              <Button type="button" onClick={saveLineup} disabled={savingLineup} className="w-fit">
                {savingLineup ? "Saving…" : "Save lineups"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base uppercase tracking-wide">Matchday photos</CardTitle>
              <CardDescription>
                {album ? `Uploading into "${album.name}"` : "Uploading will create a folder for this match automatically."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-3">
                <div className="grid gap-1.5">
                  <Label>Photos</Label>
                  <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
                </div>
                <Button type="submit" disabled={uploading || !files?.length}>
                  {uploading ? "Uploading…" : "Upload"}
                </Button>
              </form>

              {loadingAlbum ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : photos.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {photos.map((p) => (
                    <div key={p.id} className="group relative overflow-hidden rounded-sm border border-border">
                      <img src={p.url} alt={p.caption ?? ""} className="h-28 w-full object-cover" />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                        onClick={() => deletePhoto(p.id)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No photos uploaded for this match yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function LineupPicker({
  club,
  squad,
  lineup,
  suspensionMap,
  onToggle,
  onMinuteChange,
}: {
  club?: Club;
  squad: SquadPlayer[];
  lineup: Record<string, { selected: boolean; started: boolean; subbedOnMinute: string; subbedOffMinute: string }>;
  suspensionMap: Map<string, SuspensionStatus>;
  onToggle: (clubId: string, playerName: string, started: boolean) => void;
  onMinuteChange: (clubId: string, playerName: string, field: "subbedOnMinute" | "subbedOffMinute", value: string) => void;
}) {
  if (!club) return null;
  return (
    <div className="rounded-2xl border border-border/60 p-3">
      <p className="mb-2 font-display text-xs font-black uppercase tracking-wide">{club.name}</p>
      {squad.length === 0 ? (
        <p className="text-sm text-muted-foreground">No squad list for this club yet — add one under Squads.</p>
      ) : (
        <ul className="grid gap-2">
          {squad.map((p) => {
            const key = `${club.id}::${p.player_name}`;
            const entry = lineup[key];
            const suspension = suspensionMap.get(key);
            return (
              <li key={p.id} className={`rounded-xl border px-3 py-2 text-sm ${suspension?.suspended ? "border-destructive/40 bg-destructive/5" : "border-border"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {p.player_name}
                    {suspension?.suspended && <span className="ml-2 text-xs font-bold text-destructive">SUSPENDED ({suspension.matchesRemaining} left)</span>}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => onToggle(club.id, p.player_name, true)}
                      className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${entry?.selected && entry.started ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground"}`}
                    >
                      XI
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggle(club.id, p.player_name, false)}
                      className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${entry?.selected && !entry.started ? "bg-mint text-[#04231a]" : "border border-border text-muted-foreground"}`}
                    >
                      Sub
                    </button>
                  </div>
                </div>
                {entry?.selected && (
                  <div className="mt-2 flex gap-2">
                    {entry.started ? (
                      <Input
                        type="number"
                        placeholder="Subbed off (min)"
                        value={entry.subbedOffMinute}
                        onChange={(e) => onMinuteChange(club.id, p.player_name, "subbedOffMinute", e.target.value)}
                        className="h-8 text-xs"
                      />
                    ) : (
                      <Input
                        type="number"
                        placeholder="Subbed on (min)"
                        value={entry.subbedOnMinute}
                        onChange={(e) => onMinuteChange(club.id, p.player_name, "subbedOnMinute", e.target.value)}
                        className="h-8 text-xs"
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
