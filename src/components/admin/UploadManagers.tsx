import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Club = { id: string; name: string };
type Album = { id: number; name: string };
type SquadPlayer = { id: number; club_id: string | null; player_name: string; jersey_no: number | null; photo_url: string | null };
type Photo = { id: number; url: string; caption: string | null; album_id: number | null; sort_order: number };

/* ------------------------------------------------------------------ */
/* Squads — player roster with optional headshot upload to the        */
/* "players" storage bucket.                                          */
/* ------------------------------------------------------------------ */
export function SquadsManager({ clubs, onChanged }: { clubs: Club[]; onChanged?: () => void }) {
  const [players, setPlayers] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [clubId, setClubId] = useState("");
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("squads").select("*").order("club_id").order("jersey_no");
    if (error) toast.error(error.message);
    setPlayers((data as SquadPlayer[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setClubId("");
    setName("");
    setJersey("");
    setFile(null);
  }

  function startEdit(p: SquadPlayer) {
    setEditingId(p.id);
    setClubId(p.club_id ?? "");
    setName(p.player_name);
    setJersey(p.jersey_no?.toString() ?? "");
    setFile(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        club_id: clubId || null,
        player_name: name,
        jersey_no: jersey === "" ? null : Number(jersey),
      };
      if (file) {
        const path = `${clubId || "misc"}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("players").upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("players").getPublicUrl(path);
        payload.photo_url = pub.publicUrl;
      }

      const { error } =
        editingId !== null
          ? await supabase.from("squads").update(payload).eq("id", editingId)
          : await supabase.from("squads").insert(payload);
      if (error) throw error;

      toast.success(editingId !== null ? "Player saved" : "Player added");
      resetForm();
      await load();
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: SquadPlayer) {
    if (!confirm("Remove this player?")) return;
    const { error } = await supabase.from("squads").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    await load();
    onChanged?.();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base uppercase tracking-wide">
            {editingId !== null ? "Edit player" : "Add player"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Club</Label>
              <Select value={clubId} onValueChange={setClubId} disabled={editingId !== null}>
                <SelectTrigger>
                  <SelectValue placeholder="Select club…" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Player name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label>Jersey number</Label>
              <Input type="number" value={jersey} onChange={(e) => setJersey(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Headshot (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={saving || !clubId || !name}>
                {saving ? "Saving…" : editingId !== null ? "Save changes" : "Add player"}
              </Button>
              {editingId !== null && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base uppercase tracking-wide">Squads ({players.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>No.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{clubs.find((c) => c.id === p.club_id)?.name ?? p.club_id}</TableCell>
                    <TableCell>{p.player_name}</TableCell>
                    <TableCell>{p.jersey_no ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(p)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gallery — albums + photo upload to the "gallery" storage bucket.   */
/* ------------------------------------------------------------------ */
export function GalleryManager({ onChanged }: { onChanged?: () => void }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [uploadAlbumId, setUploadAlbumId] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: a, error: e1 }, { data: g, error: e2 }] = await Promise.all([
      supabase.from("albums").select("*").order("sort_order").order("created_at"),
      supabase.from("gallery").select("*").order("sort_order").order("created_at"),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    setAlbums((a as Album[]) ?? []);
    setPhotos((g as Photo[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function addAlbum(e: FormEvent) {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    const { error } = await supabase.from("albums").insert({ name: newAlbumName.trim() });
    if (error) return toast.error(error.message);
    setNewAlbumName("");
    toast.success("Album added");
    await load();
    onChanged?.();
  }

  async function deleteAlbum(id: number) {
    if (!confirm("Delete this album? Photos inside it are not deleted, just unfiled.")) return;
    const { error } = await supabase.from("albums").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await load();
    onChanged?.();
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("gallery").upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("gallery").getPublicUrl(path);
        const { error: insErr } = await supabase
          .from("gallery")
          .insert({ url: pub.publicUrl, caption: "", album_id: uploadAlbumId ? Number(uploadAlbumId) : null });
        if (insErr) throw insErr;
      }
      toast.success("Photos uploaded");
      setFiles(null);
      await load();
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function updatePhotoAlbum(photo: Photo, albumId: string) {
    const { error } = await supabase
      .from("gallery")
      .update({ album_id: albumId ? Number(albumId) : null })
      .eq("id", photo.id);
    if (error) return toast.error(error.message);
    await load();
  }

  async function updateCaption(photo: Photo, caption: string) {
    const { error } = await supabase.from("gallery").update({ caption }).eq("id", photo.id);
    if (error) toast.error(error.message);
  }

  async function deletePhoto(photo: Photo) {
    if (!confirm("Delete this photo?")) return;
    const urlParts = photo.url.split("/gallery/");
    const path = urlParts[1];
    if (path) await supabase.storage.from("gallery").remove([path]);
    const { error } = await supabase.from("gallery").delete().eq("id", photo.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    await load();
    onChanged?.();
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base uppercase tracking-wide">Albums</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={addAlbum} className="flex flex-wrap gap-2">
            <Input
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="e.g. Season Opener"
              className="max-w-xs"
            />
            <Button type="submit">Add album</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {albums.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-secondary px-3 py-1.5 text-sm"
              >
                {a.name}
                <button
                  type="button"
                  onClick={() => deleteAlbum(a.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${a.name}`}
                >
                  ×
                </button>
              </span>
            ))}
            {albums.length === 0 && <p className="text-sm text-muted-foreground">No albums yet.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base uppercase tracking-wide">Upload photos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="grid gap-1.5">
              <Label>Album</Label>
              <Select value={uploadAlbumId} onValueChange={setUploadAlbumId}>
                <SelectTrigger>
                  <SelectValue placeholder="No album" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Photos</Label>
              <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
            </div>
            <Button type="submit" disabled={uploading || !files}>
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base uppercase tracking-wide">All photos ({photos.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead>Album</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {photos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <img src={p.url} alt={p.caption ?? ""} className="h-12 w-16 rounded-sm object-cover" />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={p.caption ?? ""}
                        onBlur={(e) => updateCaption(p, e.target.value)}
                        className="min-w-[160px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={p.album_id ? String(p.album_id) : ""}
                        onValueChange={(v) => updatePhotoAlbum(p, v)}
                      >
                        <SelectTrigger className="min-w-[140px]">
                          <SelectValue placeholder="No album" />
                        </SelectTrigger>
                        <SelectContent>
                          {albums.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="destructive" onClick={() => deletePhoto(p)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
