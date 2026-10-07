import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bot,
  Users,
  Ellipsis,
  Gamepad2,
  House,
  MapPinned,
  Pause,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { MemberAvatar } from "@/components/member-avatar";
import { Splash } from "@/components/splash";
import { Badge } from "@/components/ui/badge";
import { MEMBERS } from "@/lib/family";
import { avatarSrc } from "@/lib/avatars";
import { useGuardian } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", icon: House, tone: "bg-pink text-paper", idle: "text-pink" },
  { to: "/map", label: "Map", icon: MapPinned, tone: "bg-orange text-paper", idle: "text-orange" },
  { to: "/family", label: "Family", icon: Users, tone: "bg-mint text-paper", idle: "text-mint" },
  { to: "/companions", label: "Companions", icon: Bot, tone: "bg-violet text-paper", idle: "text-violet" },
  { to: "/games", label: "Games", icon: Gamepad2, tone: "bg-gold text-fg", idle: "text-orange" },
] as const;

const MORE = [
  { to: "/settings", label: "Settings", desc: "Name, username, photo, plan" },
  { to: "/plan", label: "Household plan", desc: "Free, Complete, Scout · AUD" },
  { to: "/alerts", label: "Smart alerts", desc: "Arrivals, departures, driving" },
  { to: "/planner", label: "Pulse planner", desc: "Family schedule · private" },
  { to: "/budget", label: "Budget Hub", desc: "Real numbers. AUD. Private." },
  { to: "/protection", label: "Travel protection", desc: "Scout · coming soon" },
  { to: "/drive", label: "Drive safety", desc: "Useful trip summaries" },
  { to: "/permissions", label: "Permissions", desc: "You choose what is shared" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isGame = pathname.startsWith("/games/") && pathname !== "/games";
  const immersive = pathname === "/map";
  const hideHeader = pathname === "/" || pathname === "/plan" || immersive;
  const paused = useGuardian((s) => s.locationPaused);
  const togglePaused = useGuardian((s) => s.togglePaused);
  const [more, setMore] = useState(false);
  const [boot, setBoot] = useState(true);
  const you = MEMBERS[0]!;
  const displayName = useGuardian((s) => s.displayName) || "You";
  const username = useGuardian((s) => s.username);
  const youPhoto = useGuardian((s) => s.youPhoto);
  const avatarId = useGuardian((s) => s.avatarId);
  const face = youPhoto || (avatarId ? avatarSrc(avatarId) : null);
  const look = useGuardian((s) => s.look) || "pink";

  useEffect(() => {
    void useGuardian.persist.rehydrate();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.look = look;
  }, [look]);

  function onPause() {
    togglePaused();
    toast(paused ? "Location sharing resumed" : "Location sharing paused", {
      description: paused
        ? "Chosen locations are visible to this household again."
        : "Live locations are hidden until you turn sharing back on.",
    });
  }

  if (isGame) {
    return (
      <>
        {boot ? <Splash onDone={() => setBoot(false)} /> : null}
        <div className="kyrec-atmosphere" aria-hidden />
        <div className="relative z-10 min-h-dvh">{children}</div>
        <Toaster theme="light" position="top-center" />
      </>
    );
  }

  return (
    <>
      {boot ? <Splash onDone={() => setBoot(false)} /> : null}
      <div className="kyrec-atmosphere" aria-hidden />
      <div className={cn("relative z-10", immersive ? "min-h-dvh" : "mx-auto flex min-h-dvh max-w-[1240px]")}>
        <aside
          className={cn(
            "z-30 hidden flex-col lg:flex",
            immersive
              ? "fixed top-4 bottom-4 left-4 w-[72px] items-center rounded-2xl glass py-4"
              : "sticky top-0 h-dvh w-[232px] shrink-0 border-r border-line px-4 py-5",
          )}
        >
          <Brand compact={immersive} />
          <nav className={cn("flex flex-1 flex-col gap-1", immersive ? "mt-6 items-center" : "mt-8")}>
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                label={tab.label}
                icon={tab.icon}
                tone={tab.tone}
                idle={tab.idle}
                pathname={pathname}
                compact={immersive}
              />
            ))}
            {immersive
              ? null
              : MORE.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-black/5 hover:text-fg",
                      (pathname === item.to || pathname.startsWith(`${item.to}/`)) && "bg-black/5 text-fg",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
            {immersive ? (
              <button
                type="button"
                onClick={() => setMore(true)}
                className="mt-2 grid size-11 place-items-center rounded-xl text-muted hover:bg-black/5 hover:text-fg"
                aria-label="More"
              >
                <Ellipsis className="size-5" />
              </button>
            ) : null}
          </nav>
          <div className={cn(immersive ? "flex flex-col items-center gap-2" : "mt-auto space-y-3")}>
            <button
              type="button"
              onClick={onPause}
              className={cn(
                "flex items-center justify-center rounded-xl transition-colors",
                immersive
                  ? "size-11 text-fg hover:bg-black/5"
                  : "w-full justify-between bg-panel px-3 py-3 text-left shadow-[var(--shadow-border)]",
              )}
              aria-label={paused ? "Resume sharing" : "Pause sharing"}
            >
              {immersive ? null : (
                <span className="text-sm font-medium">{paused ? "Sharing paused" : "Pause sharing"}</span>
              )}
              {paused ? <Play className="size-4 text-green" /> : <Pause className="size-4 text-muted" />}
            </button>
            {immersive ? (
              <Link to="/settings">
                <MemberAvatar member={you} src={face} size={36} />
              </Link>
            ) : (
              <p className="px-1 text-[11px] leading-snug text-subtle">
                Built in Perth. Not an emergency service.
              </p>
            )}
          </div>
        </aside>

        <div className={cn("flex min-w-0 flex-1 flex-col", immersive && "min-h-dvh")}>
          {immersive ? (
            <div className="pointer-events-none absolute top-4 right-4 z-30 flex items-center gap-2 lg:right-5">
              <Link
                to="/alerts"
                className="pointer-events-auto relative grid size-11 place-items-center rounded-full glass"
              >
                <Bell className="size-5 text-fg" />
                <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-blue" />
              </Link>
            </div>
          ) : hideHeader ? null : (
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-ink/80 px-4 py-3 backdrop-blur-md lg:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <Brand compact />
              </div>
              <p className="hidden text-sm text-muted lg:block">Family safety, shared by choice</p>
              <div className="flex items-center gap-2">
                <Link to="/alerts" className="relative grid size-11 place-items-center rounded-lg hover:bg-black/5">
                  <Bell className="size-5 text-fg" />
                  <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-blue" />
                </Link>
                <Link to="/settings" className="flex items-center gap-2">
                  <span className="hidden text-right sm:block">
                    <span className="block max-w-28 truncate text-sm font-medium">{displayName}</span>
                    {username ? <span className="block text-[11px] text-muted">@{username}</span> : null}
                  </span>
                  <MemberAvatar member={you} src={face} size={36} />
                </Link>
              </div>
            </header>
          )}

          <main
            className={cn(
              "flex-1",
              immersive ? "p-0" : "px-4 pb-28 lg:px-8 lg:pb-10",
            )}
          >
            {children}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 rounded-2xl bg-panel/92 pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-lift)] backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-6 px-0.5 pt-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                  active ? tab.idle : "text-subtle",
                )}
              >
                <span className={cn("grid size-8 place-items-center rounded-xl", active && tab.tone)}>
                  <Icon className="size-5" />
                </span>
                {tab.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMore(true)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
              more ? "text-blue" : "text-subtle",
            )}
          >
            <Ellipsis className="size-5" />
            More
          </button>
        </div>
      </nav>

      {more ? (
        <div className="fixed inset-0 z-40">
          <button type="button" className="absolute inset-0 bg-navy/25" aria-label="Close" onClick={() => setMore(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-panel-2 p-5 pb-10 shadow-[var(--shadow-lift)] lg:inset-auto lg:top-1/2 lg:left-24 lg:bottom-auto lg:w-[360px] lg:-translate-y-1/2 lg:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Household</h2>
              <button type="button" className="grid size-11 place-items-center" onClick={() => setMore(false)}>
                <X className="size-5" />
              </button>
            </div>
            <div className="grid gap-2">
              {MORE.map((item, i) => {
                const tone = ["text-pink", "text-violet", "text-orange", "text-mint", "text-blue", "text-gold", "text-green", "text-magenta"][i] ?? "text-violet";
                return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMore(false)}
                  className="flex items-center justify-between rounded-xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]"
                >
                  <span>
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="text-xs text-muted">{item.desc}</span>
                  </span>
                  <Sparkles className={cn("size-4", tone)} />
                </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <Toaster theme="light" position="top-center" />
    </>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link to="/" className="grid size-11 place-items-center">
        <img src="/kyrec-k.png" alt="KYREC" className="size-9 rounded-lg" />
      </Link>
    );
  }
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/kyrec-logo.png" alt="KYREC" className="h-7 w-auto brightness-0" />
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Family Guardian</span>
        <Badge tone="blue" className="mt-0.5 w-fit px-1.5 py-0 text-[10px]">
          In development
        </Badge>
      </span>
    </Link>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  tone,
  idle,
  pathname,
  compact,
}: {
  to: string;
  label: string;
  icon: typeof House;
  tone: string;
  idle: string;
  pathname: string;
  compact?: boolean;
}) {
  const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
  if (compact) {
    return (
      <Link
        to={to}
        title={label}
        className={cn(
          "grid size-11 place-items-center rounded-xl transition-colors",
          active ? tone : "text-muted hover:bg-black/5 hover:text-fg",
        )}
      >
        <Icon className="size-5" />
      </Link>
    );
  }
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-white text-fg shadow-[var(--shadow-border)]" : "text-muted hover:bg-white/70 hover:text-fg",
      )}
    >
      <span className={cn("grid size-7 place-items-center rounded-lg", active ? tone : "bg-white text-subtle")}>
        <Icon className="size-4" />
      </span>
      <span className={active ? idle : undefined}>{label}</span>
    </Link>
  );
}
