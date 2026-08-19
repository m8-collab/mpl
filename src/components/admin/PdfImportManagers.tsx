import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Club } from "@/lib/league";
import {
  extractPdfText,
  parseFixturesFromText,
  parseScorersFromText,
  type ParsedFixture,
  type ParsedScorer,
} from "@/lib/pdf-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

export function FixturePdfImport({ clubs, onChanged }: { clubs: Club[]; onChanged?: () => void }) {
  const [rows, setRows] = useState<ParsedFixture[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const clubOptions = clubs.map((c) => ({ value: c.id, label: c.name }));

  async function handleFile(file: File) {
    setBusy(true);
    setFileName(file.name);
    try {
      const text = await extractPdfText(file);
      if (!text.trim()) {
        toast.error("Couldn't read any text from that PDF — it may be a scanned image rather than a text document.");
        setRows([]);
        return;
      }
      const parsed = parseFixturesFromText(text, clubs);
      if (parsed.length === 0) {
        toast.error("No fixture-looking lines found. Check the source PDF, or add rows manually below.");
      } else {
        toast.success(`Found ${parsed.length} possible fixture${parsed.length === 1 ? "" : "s"} — review before saving.`);
      }
      setRows(parsed);
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't read that PDF");
      setRows(null);
    } finally {
      setBusy(false);
    }
  }

  function updateRow(key: string, patch: Partial<ParsedFixture>) {
    setRows((prev) => prev?.map((r) => (r.key === key ? { ...r, ...patch } : r)) ?? null);
  }

  function removeRow(key: string) {
    setRows((prev) => prev?.filter((r) => r.key !== key) ?? null);
  }

  async function saveAll() {
    if (!rows) return;
    const ready = rows.filter((r) => r.date && r.homeClubId && r.awayClubId);
    if (ready.length === 0) {
      toast.error("No rows are ready to save yet — every row needs a date, home club, and away club filled in.");
      return;
    }
    setBusy(true);
    try {
      // Continue match numbering from whatever's already in the database.
      const { data: existing } = await supabase.from("fixtures").select("match_no");
      const maxNo = Math.max(
        0,
        ...(existing ?? []).map((f) => parseInt((f.match_no ?? "0").replace(/\D/g, ""), 10) || 0)
      );

      const payload = ready.map((r, i) => {
        const matchNo = String(maxNo + i + 1);
        return {
          id: `m${matchNo}`,
          match_no: matchNo,
          date: r.date,
          kickoff: r.kickoff,
          home_id: r.homeClubId,
          away_id: r.awayClubId,
          venue: r.venue,
        };
      });

      const { error } = await supabase.from("fixtures").insert(payload);
      if (error) throw error;
      toast.success(`Saved ${payload.length} fixture${payload.length === 1 ? "" : "s"}`);
      setRows(null);
      setFileName(null);
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't save those fixtures");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="font-display text-base uppercase tracking-wide">Import fixtures from PDF</CardTitle>
        <CardDescription>
          Upload a fixture list PDF — matches are extracted automatically, but always double-check the table below
          before saving. Formats vary, so extraction won't be perfect every time.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Input
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {fileName && <p className="text-xs text-muted-foreground">{busy ? "Reading…" : `Parsed: ${fileName}`}</p>}

        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Kickoff</TableHead>
                  <TableHead>Home</TableHead>
                  <TableHead>Away</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key} className={!r.date || !r.homeClubId || !r.awayClubId ? "bg-destructive/5" : undefined}>
                    <TableCell>
                      <Input
                        type="date"
                        value={r.date ?? ""}
                        onChange={(e) => updateRow(r.key, { date: e.target.value || null })}
                        className="min-w-[140px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={r.kickoff ?? ""}
                        onChange={(e) => updateRow(r.key, { kickoff: e.target.value || null })}
                        className="min-w-[110px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={r.homeClubId ?? ""} onValueChange={(v) => updateRow(r.key, { homeClubId: v })}>
                        <SelectTrigger className="min-w-[150px]">
                          <SelectValue placeholder={r.homeLabel || "Select club…"} />
                        </SelectTrigger>
                        <SelectContent>
                          {clubOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={r.awayClubId ?? ""} onValueChange={(v) => updateRow(r.key, { awayClubId: v })}>
                        <SelectTrigger className="min-w-[150px]">
                          <SelectValue placeholder={r.awayLabel || "Select club…"} />
                        </SelectTrigger>
                        <SelectContent>
                          {clubOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={r.venue ?? ""}
                        onChange={(e) => updateRow(r.key, { venue: e.target.value || null })}
                        className="min-w-[120px]"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="destructive" onClick={() => removeRow(r.key)}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">
              Rows highlighted in red are missing a date or a matched club — fix or remove them before saving.
            </p>
            <Button className="mt-3" onClick={saveAll} disabled={busy}>
              {busy ? "Saving…" : `Save ${rows.filter((r) => r.date && r.homeClubId && r.awayClubId).length} fixture(s)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Scorers                                                             */
/* ------------------------------------------------------------------ */

export function ScorersPdfImport({ clubs, onChanged }: { clubs: Club[]; onChanged?: () => void }) {
  const [rows, setRows] = useState<ParsedScorer[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const clubOptions = clubs.map((c) => ({ value: c.id, label: c.name }));

  async function handleFile(file: File) {
    setBusy(true);
    setFileName(file.name);
    try {
      const text = await extractPdfText(file);
      if (!text.trim()) {
        toast.error("Couldn't read any text from that PDF — it may be a scanned image rather than a text document.");
        setRows([]);
        return;
      }
      const parsed = parseScorersFromText(text, clubs);
      if (parsed.length === 0) {
        toast.error("No scorer-looking lines found (expects a player name, club, and goal count per line).");
      } else {
        toast.success(`Found ${parsed.length} possible scorer${parsed.length === 1 ? "" : "s"} — review before saving.`);
      }
      setRows(parsed);
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't read that PDF");
      setRows(null);
    } finally {
      setBusy(false);
    }
  }

  function updateRow(key: string, patch: Partial<ParsedScorer>) {
    setRows((prev) => prev?.map((r) => (r.key === key ? { ...r, ...patch } : r)) ?? null);
  }

  function removeRow(key: string) {
    setRows((prev) => prev?.filter((r) => r.key !== key) ?? null);
  }

  async function saveAll() {
    if (!rows) return;
    const ready = rows.filter((r) => r.playerName && r.clubId && r.goals !== null);
    if (ready.length === 0) {
      toast.error("No rows are ready to save yet — every row needs a player name, club, and goal count.");
      return;
    }
    setBusy(true);
    try {
      const payload = ready.map((r) => ({
        player_name: r.playerName,
        club_id: r.clubId,
        goals: r.goals,
      }));
      const { error } = await supabase.from("scorers").insert(payload);
      if (error) throw error;
      toast.success(`Saved ${payload.length} scorer${payload.length === 1 ? "" : "s"}`);
      setRows(null);
      setFileName(null);
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't save those scorers");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="font-display text-base uppercase tracking-wide">Import scorers from PDF</CardTitle>
        <CardDescription>
          Upload a scorers list PDF (player, club, goals per line) — review the matches below before saving. If a
          player already exists in the Scorers table, this adds a new row rather than merging, so check for
          duplicates after importing.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Input
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {fileName && <p className="text-xs text-muted-foreground">{busy ? "Reading…" : `Parsed: ${fileName}`}</p>}

        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Goals</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key} className={!r.clubId || r.goals === null ? "bg-destructive/5" : undefined}>
                    <TableCell>
                      <Input
                        value={r.playerName}
                        onChange={(e) => updateRow(r.key, { playerName: e.target.value })}
                        className="min-w-[160px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={r.clubId ?? ""} onValueChange={(v) => updateRow(r.key, { clubId: v })}>
                        <SelectTrigger className="min-w-[150px]">
                          <SelectValue placeholder={r.clubLabel || "Select club…"} />
                        </SelectTrigger>
                        <SelectContent>
                          {clubOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={r.goals ?? ""}
                        onChange={(e) => updateRow(r.key, { goals: e.target.value === "" ? null : Number(e.target.value) })}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="destructive" onClick={() => removeRow(r.key)}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">
              Rows highlighted in red are missing a matched club or goal count — fix or remove them before saving.
            </p>
            <Button className="mt-3" onClick={saveAll} disabled={busy}>
              {busy ? "Saving…" : `Save ${rows.filter((r) => r.playerName && r.clubId && r.goals !== null).length} scorer(s)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
