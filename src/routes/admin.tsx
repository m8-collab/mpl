import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { toast, Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { leagueQuery } from "@/lib/league";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityManager, type EntityConfig } from "@/components/admin/EntityManager";
import { SquadsManager, GalleryManager } from "@/components/admin/UploadManagers";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin | Mtwapa Premier League" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Screen = "loading" | "login" | "register" | "forgot" | "reset" | "pending" | "dashboard";

function AdminPage() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    async function evaluate(currentSession: Session | null) {
      if (!currentSession) {
        if (mounted) setScreen("login");
        return;
      }
      const { data: adminRow } = await supabase
        .from("admins")
        .select("approved")
        .eq("user_id", currentSession.user.id)
        .single();
      if (!mounted) return;
      setSession(currentSession);
      setScreen(adminRow?.approved ? "dashboard" : "pending");
    }

    supabase.auth.getSession().then(({ data }) => evaluate(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setSession(newSession);
        setScreen("reset");
        return;
      }
      evaluate(newSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 lg:px-8">
      <Toaster richColors position="top-right" />
      {screen === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
      {screen === "login" && <LoginCard onRegister={() => setScreen("register")} onForgot={() => setScreen("forgot")} />}
      {screen === "register" && <RegisterCard onBack={() => setScreen("login")} />}
      {screen === "forgot" && <ForgotCard onBack={() => setScreen("login")} />}
      {screen === "reset" && <ResetCard onDone={() => setScreen("login")} />}
      {screen === "pending" && <PendingCard />}
      {screen === "dashboard" && session && <Dashboard session={session} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Auth screens                                                       */
/* ------------------------------------------------------------------ */

function AuthShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <CardHeader>
          <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-sm bg-[var(--gradient-accent)] font-display text-sm font-black text-accent-foreground">
            MPL
          </div>
          <CardTitle className="text-center font-display text-xl uppercase tracking-tight">{title}</CardTitle>
          {description && <CardDescription className="text-center">{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

function LoginCard({ onRegister, onForgot }: { onRegister: () => void; onForgot: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  return (
    <AuthShell title="Admin login" description="Sign in to manage the Mtwapa Premier League site.">
      <form onSubmit={submit} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="loginEmail">Email</Label>
          <Input id="loginEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="loginPassword">Password</Label>
          <Input
            id="loginPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={busy} className="mt-1">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <button onClick={onRegister} className="text-accent hover:underline">
          Create an account
        </button>
        <button onClick={onForgot} className="text-muted-foreground hover:underline">
          Forgot password?
        </button>
      </div>
    </AuthShell>
  );
}

function RegisterCard({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDone(true);
  }

  if (done) {
    return (
      <AuthShell title="Check your email" description="Confirm your address, then sign in — an existing admin will need to approve your account before you can make changes.">
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to login
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create admin account" description="You won't be able to change anything until an existing admin approves you.">
      <form onSubmit={submit} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label>Password</Label>
          <Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label>Confirm password</Label>
          <Input type="password" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <Button type="submit" disabled={busy} className="mt-1">
          {busy ? "Creating…" : "Register"}
        </Button>
      </form>
      <button onClick={onBack} className="mt-4 text-sm text-muted-foreground hover:underline">
        Back to login
      </button>
    </AuthShell>
  );
}

function ForgotCard({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" description="We sent a password reset link — follow it to set a new password.">
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to login
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset password" description="Enter your email and we'll send you a link to set a new password.">
      <form onSubmit={submit} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" disabled={busy} className="mt-1">
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <button onClick={onBack} className="mt-4 text-sm text-muted-foreground hover:underline">
        Back to login
      </button>
    </AuthShell>
  );
}

function ResetCard({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated — sign in with your new password.");
    await supabase.auth.signOut();
    onDone();
  }

  return (
    <AuthShell title="Set a new password">
      <form onSubmit={submit} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label>New password</Label>
          <Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label>Confirm new password</Label>
          <Input type="password" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <Button type="submit" disabled={busy} className="mt-1">
          {busy ? "Saving…" : "Set password"}
        </Button>
      </form>
    </AuthShell>
  );
}

function PendingCard() {
  async function signOut() {
    await supabase.auth.signOut();
  }
  return (
    <AuthShell title="Awaiting approval" description="Your account was created, but an existing admin still needs to approve it before you can manage the site.">
      <Button variant="outline" className="w-full" onClick={signOut}>
        Sign out
      </Button>
    </AuthShell>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                          */
/* ------------------------------------------------------------------ */

function Dashboard({ session }: { session: Session }) {
  const queryClient = useQueryClient();
  const { data } = useQuery(leagueQuery);

  const clubOptions = (data?.clubs ?? []).map((c) => ({ value: c.id, label: c.name }));

  function refreshPublicSite() {
    queryClient.invalidateQueries({ queryKey: ["league"] });
  }

  const clubsConfig: EntityConfig = {
    table: "clubs",
    primaryKey: "id",
    orderBy: { column: "name" },
    fields: [
      { name: "id", label: "Club ID (slug)", type: "text", required: true, lockOnEdit: true, placeholder: "e.g. komboa" },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "venue", label: "Home venue", type: "text" },
      { name: "crest_url", label: "Crest image URL", type: "text", showInList: false },
    ],
  };

  const tableConfig: EntityConfig = {
    table: "table_rows",
    primaryKey: "club_id",
    fields: [
      { name: "club_id", label: "Club", type: "select", options: clubOptions, required: true, lockOnEdit: true },
      { name: "p", label: "Played", type: "number" },
      { name: "w", label: "Won", type: "number" },
      { name: "d", label: "Drawn", type: "number" },
      { name: "l", label: "Lost", type: "number" },
      { name: "gf", label: "Goals for", type: "number" },
      { name: "ga", label: "Goals against", type: "number" },
    ],
    numericFields: ["p", "w", "d", "l", "gf", "ga"],
  };

  const fixturesConfig: EntityConfig = {
    table: "fixtures",
    primaryKey: "id",
    orderBy: { column: "date" },
    fields: [
      { name: "match_no", label: "Match no.", type: "text", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "kickoff", label: "Kickoff time", type: "time" },
      { name: "home_id", label: "Home club", type: "select", options: clubOptions, required: true },
      { name: "away_id", label: "Away club", type: "select", options: clubOptions, required: true },
      { name: "venue", label: "Venue", type: "text" },
      { name: "home_score", label: "Home score", type: "number" },
      { name: "away_score", label: "Away score", type: "number" },
    ],
    numericFields: ["home_score", "away_score"],
    beforeInsert: (payload) => ({ ...payload, id: payload.id || `m${payload.match_no}` }),
  };

  const scorersConfig: EntityConfig = {
    table: "scorers",
    primaryKey: "id",
    orderBy: { column: "goals", ascending: false },
    fields: [
      { name: "player_name", label: "Player", type: "text", required: true },
      { name: "club_id", label: "Club", type: "select", options: clubOptions, required: true },
      { name: "goals", label: "Goals", type: "number" },
    ],
    numericFields: ["goals"],
  };

  const newsConfig: EntityConfig = {
    table: "news",
    primaryKey: "id",
    orderBy: { column: "created_at", ascending: false },
    fields: [
      { name: "tag", label: "Tag", type: "text", placeholder: "e.g. Matchday" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "body", label: "Body", type: "textarea", showInList: false },
    ],
  };

  const settingsConfig: EntityConfig = {
    table: "settings",
    primaryKey: "id",
    fields: [
      { name: "season_label", label: "Season label", type: "text" },
      { name: "as_of_label", label: "\"As of\" label", type: "text" },
    ],
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-accent">Admin</p>
          <h1 className="mt-1 font-display text-2xl font-black lg:text-3xl">Manage the site</h1>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {session.user.email}</p>
        </div>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </div>

      <Tabs defaultValue="clubs">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="clubs">Clubs</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="scorers">Scorers</TabsTrigger>
          <TabsTrigger value="squads">Squads</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        <TabsContent value="clubs" className="pt-6">
          <EntityManager config={clubsConfig} title="Club" onChanged={refreshPublicSite} />
        </TabsContent>
        <TabsContent value="table" className="pt-6">
          <EntityManager config={tableConfig} title="Table row" onChanged={refreshPublicSite} />
        </TabsContent>
        <TabsContent value="fixtures" className="pt-6">
          <EntityManager config={fixturesConfig} title="Fixture" onChanged={refreshPublicSite} />
        </TabsContent>
        <TabsContent value="scorers" className="pt-6">
          <EntityManager config={scorersConfig} title="Scorer" onChanged={refreshPublicSite} />
        </TabsContent>
        <TabsContent value="squads" className="pt-6">
          <SquadsManager clubs={data?.clubs ?? []} onChanged={refreshPublicSite} />
        </TabsContent>
        <TabsContent value="news" className="pt-6">
          <EntityManager config={newsConfig} title="News post" onChanged={refreshPublicSite} />
        </TabsContent>
        <TabsContent value="gallery" className="pt-6">
          <GalleryManager onChanged={refreshPublicSite} />
        </TabsContent>
        <TabsContent value="settings" className="pt-6">
          <SettingsPanel config={settingsConfig} onChanged={refreshPublicSite} />
        </TabsContent>
        <TabsContent value="admins" className="pt-6">
          <AdminsPanel currentUserId={session.user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Settings is always exactly one row (id=1), so it gets a plain form instead of the list-based EntityManager. */
function SettingsPanel({ config, onChanged }: { config: EntityConfig; onChanged: () => void }) {
  const [seasonLabel, setSeasonLabel] = useState("");
  const [asOfLabel, setAsOfLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        setSeasonLabel(data?.season_label ?? "");
        setAsOfLabel(data?.as_of_label ?? "");
        setLoaded(true);
      });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("settings")
      .update({ season_label: seasonLabel || null, as_of_label: asOfLabel || null })
      .eq("id", 1);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
    onChanged();
  }

  if (!loaded) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-base uppercase tracking-wide">Site settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Season label</Label>
            <Input value={seasonLabel} onChange={(e) => setSeasonLabel(e.target.value)} placeholder="Season 2026 · 5th Edition" />
          </div>
          <div className="grid gap-1.5">
            <Label>"As of" label</Label>
            <Input value={asOfLabel} onChange={(e) => setAsOfLabel(e.target.value)} placeholder="as of 14 August 2026" />
          </div>
          <Button type="submit" disabled={busy} className="mt-1 w-fit">
            {busy ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type AdminRow = { user_id: string; email: string | null; approved: boolean; created_at: string };

function AdminsPanel({ currentUserId }: { currentUserId: string }) {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("admins").select("*").order("created_at");
    if (error) toast.error(error.message);
    setAdmins((data as AdminRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function setApproved(row: AdminRow, approved: boolean) {
    const { error } = await supabase.from("admins").update({ approved }).eq("user_id", row.user_id);
    if (error) return toast.error(error.message);
    toast.success(approved ? "Approved" : "Access revoked");
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-base uppercase tracking-wide">Admin accounts</CardTitle>
        <CardDescription>Approve new registrations or revoke an existing admin's access.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <TableRow key={a.user_id}>
                  <TableCell>
                    {a.email}
                    {a.user_id === currentUserId && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell>{a.approved ? "Approved" : "Pending"}</TableCell>
                  <TableCell className="text-right">
                    {a.approved ? (
                      <Button size="sm" variant="destructive" onClick={() => setApproved(a, false)} disabled={a.user_id === currentUserId}>
                        Revoke
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setApproved(a, true)}>
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
