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
import { MatchOfficialDashboard } from "@/components/admin/MatchOfficialDashboard";
import { DashboardShell, StatCard, DashCard, type NavItem } from "@/components/admin/DashboardShell";
import { LayoutDashboard, ClipboardList, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/matchcom")({
  head: () => ({
    meta: [
      { title: "MatchCom | Mtwapa Premier League" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MatchComPage,
});

type Screen = "loading" | "login" | "register" | "forgot" | "reset" | "pending" | "dashboard";

function MatchComPage() {
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
      // Both roles can use this page — a full admin filing a match report
      // doesn't need to go dig through the /admin tabs to do it.
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
    <div className={screen === "dashboard" ? "min-h-[70vh]" : "mx-auto min-h-[70vh] max-w-5xl px-4 py-10 lg:px-8"}>
      <Toaster richColors position="top-right" />
      {screen === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
      {screen === "login" && <LoginCard onRegister={() => setScreen("register")} onForgot={() => setScreen("forgot")} />}
      {screen === "register" && <RegisterCard onBack={() => setScreen("login")} />}
      {screen === "forgot" && <ForgotCard onBack={() => setScreen("login")} />}
      {screen === "reset" && <ResetCard onDone={() => setScreen("login")} />}
      {screen === "pending" && <PendingCard />}
      {screen === "dashboard" && session && <OfficialDashboardScreen session={session} />}
    </div>
  );
}

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
    <AuthShell title="MatchCom login" description="Sign in to file a match report.">
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
          Register for MatchCom
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
    // The role passed here lands in auth.users.raw_user_meta_data, which
    // the handle_new_admin_signup trigger reads to set admins.role —
    // this is what keeps this account restricted to match reports only,
    // instead of getting full /admin access.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: "match_official" } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDone(true);
  }

  if (done) {
    return (
      <AuthShell title="Check your email" description="Confirm your address, then sign in — an admin still needs to approve your account before you can file reports.">
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to login
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Register for MatchCom" description="This account can only file match reports — it won't have access to the full admin panel.">
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
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/matchcom` : undefined,
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
    <AuthShell title="Awaiting approval" description="Your account was created, but an admin still needs to approve it before you can file match reports.">
      <Button variant="outline" className="w-full" onClick={signOut}>
        Sign out
      </Button>
    </AuthShell>
  );
}

function OfficialDashboardScreen({ session }: { session: Session }) {
  const { data } = useQuery(leagueQuery);
  const queryClient = useQueryClient();
  const [section, setSection] = useState("overview");

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["league"] });
  }

  const navItems: NavItem[] = [
    { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "file-report", label: "File Report", icon: <ClipboardList size={18} /> },
  ];

  const pending = (data?.fixtures ?? []).filter((f) => f.home_score === null || f.away_score === null);
  const myAssignments = pending.filter((f) => f.assigned_official_id === session.user.id);
  const nextFixture = (myAssignments.length ? myAssignments : pending).slice().sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <DashboardShell
      portal="official"
      brand="MatchCom"
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard
              label="Assigned to you"
              value={String(myAssignments.length)}
              icon={<ClipboardList size={18} className="text-[#04231a]" />}
              tint="var(--mint)"
            />
            <StatCard
              label="Fixtures needing a report"
              value={String(pending.length)}
              icon={<ClipboardList size={18} className="text-[#04231a]" />}
              tint="var(--mint)"
            />
            <StatCard
              label="Total fixtures this season"
              value={String(data?.fixtures.length ?? 0)}
              icon={<CalendarClock size={18} className="text-[#04231a]" />}
              tint="var(--mint)"
            />
          </div>

          <DashCard
            title={myAssignments.length ? "Your next assigned fixture" : "Next fixture to report"}
            action={
              <button onClick={() => setSection("file-report")} className="text-xs font-semibold text-[#0a7a58] hover:underline">
                File report
              </button>
            }
          >
            {nextFixture ? (
              <div>
                <p className="text-xs text-muted-foreground">{nextFixture.date} {nextFixture.kickoff ?? ""}</p>
                <p className="mt-1 font-display text-base font-bold">
                  {data?.clubMap[nextFixture.home_id ?? ""]?.name ?? "TBC"} vs {data?.clubMap[nextFixture.away_id ?? ""]?.name ?? "TBC"}
                </p>
                {nextFixture.venue && <p className="text-xs text-muted-foreground">{nextFixture.venue}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Every fixture already has a result filed. Nothing pending.</p>
            )}
          </DashCard>
        </div>
      )}

      {section === "file-report" && (
        <MatchOfficialDashboard clubs={data?.clubs ?? []} fixtures={data?.fixtures ?? []} onChanged={refresh} />
      )}
    </DashboardShell>
  );
}
