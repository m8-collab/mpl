import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Club, Fixture, CardEntry, CardType } from "@/lib/league";

type AlbumRow = { id: number; name: string; fixture_id: string | null };
type PhotoRow = { id: number; url: string; caption: string | null; album_id: number | null };

/**
 * Everything a match official needs to file after a game, in one place:
 * result, lineups, cards, man of the match, and matchday photos — all
 * tied to a single fixture, instead of spread across separate tabs.
 */
export function MatchOfficialDashboard({
  clubs,
  fixtures,
  onChanged,
}: {
  clubs: Club[];
  fixtures: Fixture[];
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
    home_lineup: "",
    away_lineup: "",
  });
  const [savingReport, setSavingReport] = useState(false);

  useEffect(() => {
    if (!fixture) {
      setForm({ home_score: "", away_score: "", match_official: "", man_of_the_match: "", home_lineup: "", away_lineup: "" });
      return;
    }
    setForm({
      home_score: fixture.home_score?.toString() ?? "",
      away_score: fixture.away_score?.toString() ?? "",
      match_official: fixture.match_official ?? "",
      man_of_the_match: fixture.man_of_the_match ?? "",
      home_lineup: fixture.home_lineup ?? "",
      away_lineup: fixture.away_lineup ?? "",
    });
  }, [fixture?.id]);

  async function saveReport(e: FormEvent) {
    e.preventDefault();
    if (!fixtureId) return;
    setSavingReport(true);
    const { error } = await supabase
      .from("fixtures")
      .update({
        home_score: form.home_score === "" ? null : Number(form.home_score),
        away_score: form.away_score === "" ? null : Number(form.away_score),
        match_official: form.match_official || null,
        man_of_the_match: form.man_of_the_match || null,
        home_lineup: form.home_lineup || null,
        away_lineup: form.away_lineup || null,
      })
      .eq("id", fixtureId);
    setSavingReport(false);
    if (error) return toast.error(error.message);
    toast.success("Match report saved");
    onChanged?.();
  }

  // ---- cards for this fixture ----
  const [cards, setCards] = useState<CardEntry[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardForm, setCardForm] = useState({ club_id: "", player_name: "", card_type: "yellow" as CardType, red_via_two_yellows: false });
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
    setCardForm({ club_id: "", player_name: "", card_type: "yellow", red_via_two_yellows: false });
  }, [fixtureId]);

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
    });
    setSavingCard(false);
    if (error) return toast.error(error.message);
    toast.success("Card added");
    setCardForm({ club_id: "", player_name: "", card_type: "yellow", red_via_two_yellows: false });
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
            <CardHeader>
              <CardTitle className="font-display text-base uppercase tracking-wide">
                Match report — {homeClub?.name ?? "TBC"} v {awayClub?.name ?? "TBC"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveReport} className="grid gap-4">
                <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                  <div className="grid gap-1.5">
                    <Label>{homeClub?.name ?? "Home"} score</Label>
                    <Input
                      type="number"
                      value={form.home_score}
                      onChange={(e) => setForm((f) => ({ ...f, home_score: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{awayClub?.name ?? "Away"} score</Label>
                    <Input
                      type="number"
                      value={form.away_score}
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label>{homeClub?.name ?? "Home"} lineup (XI + subs, one per line)</Label>
                    <Textarea
                      rows={6}
                      value={form.home_lineup}
                      onChange={(e) => setForm((f) => ({ ...f, home_lineup: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{awayClub?.name ?? "Away"} lineup (XI + subs, one per line)</Label>
                    <Textarea
                      rows={6}
                      value={form.away_lineup}
                      onChange={(e) => setForm((f) => ({ ...f, away_lineup: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Button type="submit" disabled={savingReport}>
                    {savingReport ? "Saving…" : "Save match report"}
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
              <form onSubmit={addCard} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-end">
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
