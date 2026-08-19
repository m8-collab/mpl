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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityManager, type EntityConfig } from "@/components/admin/EntityManager";
import { FixturePdfImport, ScorersPdfImport } from "@/components/admin/PdfImportManagers";
import { DashboardShell, StatCard, DashCard, type NavItem } from "@/components/admin/DashboardShell";
import {
  LayoutDashboard,
  Shield,
  ListOrdered,
  CalendarDays,
  Target,
  Users,
  AlertTriangle,
  Newspaper,
  Image as ImageIcon,
  Handshake,
  Settings as SettingsIcon,
  UserCog,
  Trophy,
  Goal,
} from "lucide-react";
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

type Screen = "loading" | "login" | "register" | "forgot" | "reset" | "pending" | "official-redirect" | "dashboard";

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
        .select("approved, role")
        .eq("user_id", currentSession.user.id)
        .single();
      if (!mounted) return;
      setSession(currentSession);
      if (!adminRow?.approved) {
        setScreen("pending");
      } else if (adminRow.role === "match_official") {
        setScreen("official-redirect");
      } else {
        setScreen("dashboard");
      }
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
    <div className={screen === "dashboard" ? "min-h-[70vh]" : "mx-auto min-h-[70vh] max-w-6xl px-4 py-10 lg:px-8"}>
      <Toaster richColors position="top-right" />
      {screen === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
      {screen === "login" && <LoginCard onRegister={() => setScreen("register")} onForgot={() => setScreen("forgot")} />}
      {screen === "register" && <RegisterCard onBack={() => setScreen("login")} />}
      {screen === "forgot" && <ForgotCard onBack={() => setScreen("login")} />}
      {screen === "reset" && <ResetCard onDone={() => setScreen("login")} />}
      {screen === "pending" && <PendingCard />}
      {screen === "official-redirect" && <OfficialRedirectCard />}
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

function OfficialRedirectCard() {
  return (
    <AuthShell
      title="Wrong portal"
      description="This account is a match official login — it doesn't have access to the full admin panel. Head to the match officials page to file a report instead."
    >
      <Button asChild className="w-full">
        <a href="/officials">Go to Match Officials</a>
      </Button>
      <Button variant="outline" className="mt-2 w-full" onClick={() => supabase.auth.signOut()}>
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
  const [section, setSection] = useState("overview");

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
      {
        name: "pts_adjustment",
        label: "Points adjustment (+/-, e.g. disciplinary deduction)",
        type: "number",
      },
    ],
    numericFields: ["p", "w", "d", "l", "gf", "ga", "pts_adjustment"],
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
      { name: "match_official", label: "Match official (referee)", type: "text", showInList: false },
      { name: "man_of_the_match", label: "Man of the Match", type: "text", showInList: false, placeholder: "Player with the standout performance in this game" },
      {
        name: "home_lineup",
        label: "Home lineup (starting XI + subs, one per line)",
        type: "textarea",
        showInList: false,
      },
      {
        name: "away_lineup",
        label: "Away lineup (starting XI + subs, one per line)",
        type: "textarea",
        showInList: false,
      },
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

  const fixtureOptions = (data?.fixtures ?? [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((f) => ({
      value: f.id,
      label: `${f.match_no ? `#${f.match_no} · ` : ""}${data?.clubMap[f.home_id ?? ""]?.name ?? "TBC"} v ${
        data?.clubMap[f.away_id ?? ""]?.name ?? "TBC"
      } (${f.date})`,
    }));

  const cardsConfig: EntityConfig = {
    table: "cards",
    primaryKey: "id",
    orderBy: { column: "created_at", ascending: false },
    fields: [
      { name: "fixture_id", label: "Match", type: "select", options: fixtureOptions, required: true },
      { name: "club_id", label: "Club", type: "select", options: clubOptions, required: true },
      { name: "player_name", label: "Player", type: "text", required: true },
      {
        name: "card_type",
        label: "Card",
        type: "select",
        required: true,
        options: [
          { value: "yellow", label: "Yellow" },
          { value: "red", label: "Red" },
        ],
      },
      { name: "red_via_two_yellows", label: "Red via 2nd yellow?", type: "boolean" },
    ],
    booleanFields: ["red_via_two_yellows"],
  };

  const sponsorsConfig: EntityConfig = {
    table: "sponsors",
    primaryKey: "id",
    orderBy: { column: "sort_order" },
    fields: [
      { name: "name", label: "Sponsor name", type: "text", required: true },
      { name: "logo_url", label: "Logo image URL", type: "text" },
      { name: "link", label: "Website / social link", type: "text" },
      { name: "sort_order", label: "Order", type: "number" },
    ],
    numericFields: ["sort_order"],
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
      { name: "edition_label", label: "Edition (used in footer copyright, e.g. \"5th Edition\")", type: "text" },
      { name: "facebook_url", label: "Facebook URL", type: "text" },
      { name: "instagram_url", label: "Instagram URL", type: "text" },
      { name: "twitter_url", label: "Twitter / X URL", type: "text" },
      { name: "whatsapp_url", label: "WhatsApp link", type: "text" },
    ],
  };

  const navItems: NavItem[] = [
    { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "clubs", label: "Clubs", icon: <Shield size={18} /> },
    { id: "table", label: "Table", icon: <ListOrdered size={18} /> },
    { id: "fixtures", label: "Fixtures", icon: <CalendarDays size={18} /> },
    { id: "scorers", label: "Scorers", icon: <Target size={18} /> },
    { id: "squads", label: "Squads", icon: <Users size={18} /> },
    { id: "cards", label: "Discipline", icon: <AlertTriangle size={18} /> },
    { id: "news", label: "News", icon: <Newspaper size={18} /> },
    { id: "gallery", label: "Gallery", icon: <ImageIcon size={18} /> },
    { id: "sponsors", label: "Sponsors", icon: <Handshake size={18} /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
    { id: "admins", label: "Admins", icon: <UserCog size={18} /> },
  ];

  const nextFixture = (data?.fixtures ?? [])
    .filter((f) => f.home_score === null || f.away_score === null)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const topScorer = (data?.scorers ?? []).slice().sort((a, b) => b.goals - a.goals)[0];
  const leader = data?.standings?.[0];
  const matchesPlayed = (data?.standings ?? []).reduce((sum, r) => sum + r.p, 0) / 2;

  return (
    <DashboardShell
      portal="admin"
      brand="MPL Admin"
      navItems={navItems}
      activeId={section}
      onSelect={setSection}
      userEmail={session.user.email ?? ""}
      onSignOut={() => supabase.auth.signOut()}
      greeting="Welcome back"
      title={navItems.find((n) => n.id === section)?.label ?? "Dashboard"}
    >
      {section === "overview" && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total clubs" value={String(data?.clubs.length ?? 0)} icon={<Shield size={18} className="text-white" />} tint="oklch(0.63 0.25 5)" />
            <StatCard label="Matches played" value={String(matchesPlayed)} icon={<CalendarDays size={18} className="text-white" />} tint="oklch(0.55 0.2 330)" />
            <StatCard
              label="Leading scorer"
              value={topScorer ? `${topScorer.player_name} · ${topScorer.goals}` : "—"}
              icon={<Goal size={18} className="text-white" />}
              tint="oklch(0.6 0.16 158)"
            />
            <StatCard
              label="Table leader"
              value={leader ? `${leader.club.name} · ${leader.pts}pts` : "—"}
              icon={<Trophy size={18} className="text-white" />}
              tint="oklch(0.7 0.18 80)"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DashCard title="Next fixture needing a result" action={<button onClick={() => setSection("fixtures")} className="text-xs font-semibold text-accent hover:underline">View all</button>}>
              {nextFixture ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{nextFixture.date} {nextFixture.kickoff ?? ""}</p>
                    <p className="mt-1 font-display text-base font-bold">
                      {data?.clubMap[nextFixture.home_id ?? ""]?.name ?? "TBC"} vs {data?.clubMap[nextFixture.away_id ?? ""]?.name ?? "TBC"}
                    </p>
                    {nextFixture.venue && <p className="text-xs text-muted-foreground">{nextFixture.venue}</p>}
                  </div>
                  <a
                    href="/officials"
                    className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"
                  >
                    Go to Match Officials
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">All fixtures have results. Nice.</p>
              )}
            </DashCard>

            <DashCard title="Standings" action={<button onClick={() => setSection("table")} className="text-xs font-semibold text-accent hover:underline">View all</button>}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[0.65rem] uppercase text-muted-foreground">
                      <th className="pb-2 pr-2">#</th>
                      <th className="pb-2 pr-2">Club</th>
                      <th className="pb-2 pr-2 text-right">MP</th>
                      <th className="pb-2 pr-2 text-right">GD</th>
                      <th className="pb-2 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.standings ?? []).slice(0, 6).map((r) => (
                      <tr key={r.club_id} className="border-t border-border/60">
                        <td className="py-2 pr-2 text-muted-foreground">{r.rank}</td>
                        <td className="py-2 pr-2 font-semibold">{r.club.name}</td>
                        <td className="py-2 pr-2 text-right">{r.p}</td>
                        <td className="py-2 pr-2 text-right">{r.gd}</td>
                        <td className="py-2 text-right font-bold">{r.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashCard>
          </div>
        </div>
      )}

      {section === "clubs" && <EntityManager config={clubsConfig} title="Club" onChanged={refreshPublicSite} />}
      {section === "table" && (
        <>
          <EntityManager config={tableConfig} title="Table row" onChanged={refreshPublicSite} />
          <p className="mt-3 text-xs text-muted-foreground">
            P/W/D/L/GF/GA are recalculated automatically from Fixtures scores whenever a fixture is saved — this tab
            is for one-off corrections and for "Points adjustment" (e.g. a disciplinary deduction), which is the
            only field here that survives a recalc.
          </p>
        </>
      )}
      {section === "fixtures" && (
        <>
          <FixturePdfImport clubs={data?.clubs ?? []} onChanged={refreshPublicSite} />
          <EntityManager config={fixturesConfig} title="Fixture" onChanged={refreshPublicSite} />
        </>
      )}
      {section === "scorers" && (
        <>
          <ScorersPdfImport clubs={data?.clubs ?? []} onChanged={refreshPublicSite} />
          <EntityManager config={scorersConfig} title="Scorer" onChanged={refreshPublicSite} />
        </>
      )}
      {section === "squads" && <SquadsManager clubs={data?.clubs ?? []} onChanged={refreshPublicSite} />}
      {section === "cards" && (
        <>
          <EntityManager config={cardsConfig} title="Card" onChanged={refreshPublicSite} />
          <p className="mt-3 text-xs text-muted-foreground">
            5 yellow cards in the season = 1-match ban. Any red card (direct, or a 2nd yellow) = 3-match ban. See the
            public Discipline page for the live ban list.
          </p>
        </>
      )}
      {section === "news" && <EntityManager config={newsConfig} title="News post" onChanged={refreshPublicSite} />}
      {section === "gallery" && <GalleryManager onChanged={refreshPublicSite} />}
      {section === "sponsors" && <EntityManager config={sponsorsConfig} title="Sponsor" onChanged={refreshPublicSite} />}
      {section === "settings" && <SettingsPanel config={settingsConfig} onChanged={refreshPublicSite} />}
      {section === "admins" && <AdminsPanel currentUserId={session.user.id} />}
    </DashboardShell>
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

function CreateOfficialForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);

  function generatePassword() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setPassword(out);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
      const res = await fetch(`${supabaseUrl}/functions/v1/create-match-official`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't create the account");

      setResult({ email, password });
      setEmail("");
      setPassword("");
      toast.success("Match official account created and approved");
      onCreated();
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't create the account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-border/60 bg-secondary/40 p-4">
      <p className="mb-3 font-display text-xs font-black uppercase tracking-wide">Create a match official login</p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label>Password</Label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <Button type="button" variant="outline" onClick={generatePassword}>
          Generate
        </Button>
        <Button type="submit" disabled={busy || !email || password.length < 6}>
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        This creates a ready-to-use, already-approved login — no self-registration or approval step needed. Share the
        email and password with the official directly; they can sign in at <code>/officials</code> right away.
      </p>
      {result && (
        <div className="mt-3 rounded-xl border border-mint/40 bg-mint/10 p-3 text-sm">
          <p className="font-semibold">Share these credentials with the official:</p>
          <p className="mt-1">
            Email: <code>{result.email}</code>
          </p>
          <p>
            Password: <code>{result.password}</code>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This is shown once — it isn't stored anywhere retrievable, so copy it now.
          </p>
        </div>
      )}
    </div>
  );
}

type AdminRow = { user_id: string; email: string | null; approved: boolean; created_at: string; role: "admin" | "match_official" };

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

  const fullAdmins = admins.filter((a) => a.role === "admin");
  const officials = admins.filter((a) => a.role === "match_official");

  function AccountsTable({ rows, emptyText }: { rows: AdminRow[]; emptyText: string }) {
    if (rows.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
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
    );
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base uppercase tracking-wide">Admin accounts</CardTitle>
          <CardDescription>Full access — approve new registrations or revoke an existing admin's access.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <AccountsTable rows={fullAdmins} emptyText="No admin accounts yet." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base uppercase tracking-wide">Match officials</CardTitle>
          <CardDescription>
            Restricted accounts, registered separately at <code>/officials</code> — they can only file match reports
            there and have no access to this admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <CreateOfficialForm onCreated={load} />
          <AccountsTable rows={officials} emptyText="No match official accounts yet." />
        </CardContent>
      </Card>
    </div>
  );
}
