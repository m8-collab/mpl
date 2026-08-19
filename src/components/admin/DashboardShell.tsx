import { type ReactNode } from "react";
import { Search, Bell } from "lucide-react";
import { InstallAppButton } from "@/components/league/InstallAppButton";

export type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

/**
 * Shared shell for /admin and /officials. Same visual language (soft
 * rounded cards, icon sidebar, greeting header) on purpose — but each
 * portal passes its own brand label, nav items, and accent so the two
 * read as genuinely separate applications, not one dashboard with
 * extra buttons. `portal` only changes the accent color; it doesn't
 * change access — that's enforced server-side by the RLS policies.
 */
export function DashboardShell({
  portal,
  brand,
  navItems,
  activeId,
  onSelect,
  userEmail,
  onSignOut,
  greeting,
  title,
  children,
}: {
  portal: "admin" | "official";
  brand: string;
  navItems: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  userEmail: string;
  onSignOut: () => void;
  greeting: string;
  title: string;
  children: ReactNode;
}) {
  const accent = portal === "admin" ? "var(--gradient-accent)" : "var(--mint)";
  const accentText = portal === "admin" ? "text-accent-foreground" : "text-[#04231a]";

  return (
    <div className="dash-shell min-h-screen">
      <div className="mx-auto flex max-w-[1400px] gap-4 p-3 sm:p-5 lg:gap-6 lg:p-6">
        {/* ---------- Sidebar ---------- */}
        <aside className="hidden w-60 shrink-0 rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur lg:block">
          <div className="mb-8 flex items-center gap-2 px-1">
            <span
              className={`grid h-8 w-8 place-items-center rounded-xl font-display text-[0.65rem] font-black ${accentText}`}
              style={{ background: accent }}
            >
              MPL
            </span>
            <span className="font-display text-base font-black tracking-tight">{brand}</span>
          </div>

          <nav className="grid gap-1">
            {navItems.map((item) => {
              const active = item.id === activeId;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    active
                      ? `${accentText} shadow-sm`
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  style={active ? { background: accent } : undefined}
                >
                  <span className="grid h-5 w-5 place-items-center">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ---------- Main ---------- */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/60 bg-card/70 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold" style={{ color: portal === "admin" ? "oklch(0.63 0.25 5)" : "oklch(0.6 0.16 158)" }}>
                {greeting}
              </p>
              <h1 className="mt-0.5 font-display text-xl font-black tracking-tight sm:text-2xl">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <InstallAppButton className="hidden sm:inline-flex" />
              <button
                type="button"
                aria-label="Search"
                className="grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:bg-secondary"
              >
                <Search size={16} />
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className="grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:bg-secondary"
              >
                <Bell size={16} />
              </button>
              <div className="hidden items-center gap-2 border-l border-border/60 pl-3 sm:flex">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full font-display text-xs font-black ${accentText}`}
                  style={{ background: accent }}
                >
                  {userEmail.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-[140px] truncate text-sm font-semibold">{userEmail}</span>
              </div>
              <button
                onClick={onSignOut}
                className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Mobile nav (sidebar becomes a horizontal scroller under lg) */}
          <div className="mb-3 sm:hidden">
            <InstallAppButton className="w-full justify-center" />
          </div>
          <div className="mb-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
            {navItems.map((item) => {
              const active = item.id === activeId;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
                    active ? `border-transparent ${accentText}` : "border-border/60 text-muted-foreground"
                  }`}
                  style={active ? { background: accent } : undefined}
                >
                  <span className="grid h-4 w-4 place-items-center">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tint: string;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ background: tint }}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate font-display text-lg font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function DashCard({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur sm:p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-black uppercase tracking-wide">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
