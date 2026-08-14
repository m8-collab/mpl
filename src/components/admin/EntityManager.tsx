import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FieldType = "text" | "number" | "date" | "time" | "textarea" | "select";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  /** Only for type "select" — usually populated from another entity's rows. */
  options?: { value: string; label: string }[];
  required?: boolean;
  /** Shown as a column in the list table. Defaults to true for text/select/number. */
  showInList?: boolean;
  /** Disabled once editing an existing row (used for primary keys that can't change). */
  lockOnEdit?: boolean;
  placeholder?: string;
};

export type EntityConfig = {
  table: string;
  primaryKey: string;
  fields: FieldDef[];
  numericFields?: string[];
  /** Called right before insert to fill in derived fields, e.g. fixtures.id from match_no. */
  beforeInsert?: (payload: Record<string, any>) => Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  rowLabel?: (row: Record<string, any>) => string;
};

function emptyPayload(fields: FieldDef[]) {
  const p: Record<string, any> = {};
  fields.forEach((f) => (p[f.name] = ""));
  return p;
}

export function EntityManager({
  config,
  title,
  onChanged,
}: {
  config: EntityConfig;
  title: string;
  onChanged?: () => void;
}) {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [payload, setPayload] = useState<Record<string, any>>(emptyPayload(config.fields));
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    let query = supabase.from(config.table).select("*");
    if (config.orderBy) query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? true });
    const { data, error } = await query;
    if (error) toast.error(`Couldn't load ${title}: ${error.message}`);
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(row: Record<string, any>) {
    setEditingId(row[config.primaryKey]);
    const next = emptyPayload(config.fields);
    config.fields.forEach((f) => {
      next[f.name] = row[f.name] ?? "";
    });
    setPayload(next);
    window.scrollTo({ top: window.scrollY, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setPayload(emptyPayload(config.fields));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    let clean: Record<string, any> = {};
    for (const f of config.fields) {
      const v = payload[f.name];
      clean[f.name] = v === "" || v === undefined ? null : v;
    }
    (config.numericFields ?? []).forEach((f) => {
      if (clean[f] !== null && clean[f] !== undefined) clean[f] = Number(clean[f]);
    });

    let error;
    if (editingId !== null) {
      if (config.fields.some((f) => f.name === config.primaryKey && f.lockOnEdit)) {
        delete clean[config.primaryKey];
      }
      ({ error } = await supabase.from(config.table).update(clean).eq(config.primaryKey, editingId));
    } else {
      if (config.beforeInsert) clean = config.beforeInsert(clean);
      ({ error } = await supabase.from(config.table).insert(clean));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId !== null ? "Saved" : "Added");
    cancelEdit();
    await load();
    onChanged?.();
  }

  async function handleDelete(row: Record<string, any>) {
    const id = row[config.primaryKey];
    if (!confirm("Delete this? This cannot be undone.")) return;
    const { error } = await supabase.from(config.table).delete().eq(config.primaryKey, id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    await load();
    onChanged?.();
  }

  const listFields = config.fields.filter((f) => f.showInList !== false);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base uppercase tracking-wide">
            {editingId !== null ? `Edit ${title}` : `Add ${title}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-3">
            {config.fields.map((f) => (
              <div key={f.name} className="grid gap-1.5">
                <Label htmlFor={f.name}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.name}
                    value={payload[f.name] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setPayload((p) => ({ ...p, [f.name]: e.target.value }))}
                    required={f.required}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={payload[f.name] ? String(payload[f.name]) : ""}
                    onValueChange={(v) => setPayload((p) => ({ ...p, [f.name]: v }))}
                    disabled={editingId !== null && f.lockOnEdit}
                  >
                    <SelectTrigger id={f.name}>
                      <SelectValue placeholder={`Select ${f.label.toLowerCase()}…`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={f.name}
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "time" ? "time" : "text"}
                    value={payload[f.name] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setPayload((p) => ({ ...p, [f.name]: e.target.value }))}
                    required={f.required}
                    disabled={editingId !== null && f.lockOnEdit}
                  />
                )}
              </div>
            ))}
            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId !== null ? "Save changes" : `Add ${title}`}
              </Button>
              {editingId !== null && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base uppercase tracking-wide">
            {title} ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing here yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {listFields.map((f) => (
                    <TableHead key={f.name}>{f.label}</TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row[config.primaryKey]}>
                    {listFields.map((f) => (
                      <TableCell key={f.name} className="max-w-[220px] truncate">
                        {f.type === "select"
                          ? f.options?.find((o) => o.value === row[f.name])?.label ?? row[f.name] ?? "—"
                          : String(row[f.name] ?? "—")}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(row)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(row)}>
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
