import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Mail,
  BookOpenText,
  MessagesSquare,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiStatus } from "@/lib/ai-status";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email", label: "Email Generator", icon: Mail },
  { to: "/research", label: "Research Assistant", icon: BookOpenText },
  { to: "/chat", label: "AI Workplace Chat", icon: MessagesSquare },
  { to: "/about", label: "Settings / About", icon: Settings },
] as const;

export function AiStatusBadge() {
  const { data, isLoading, isError } = useAiStatus();
  const ok = data?.configured && !isError;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        isLoading
          ? "border-border text-muted-foreground"
          : ok
            ? "border-teal/30 bg-accent text-accent-foreground"
            : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", isLoading ? "bg-muted-foreground" : ok ? "bg-teal" : "bg-destructive")} />
      {isLoading ? "Checking AI…" : ok ? "AI connected" : "AI not configured"}
    </span>
  );
}

function NavList({ collapsed, onNav }: { collapsed?: boolean; onNav?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((n) => {
        const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNav}
            title={collapsed ? n.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-2",
            )}
          >
            <n.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{n.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal text-sidebar">
        <Briefcase className="h-4 w-4" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-semibold text-sidebar-accent-foreground">Workplace</div>
          <div className="text-[11px] text-sidebar-foreground">AI Productivity Assistant</div>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV.find((n) => (n.to === "/" ? path === "/" : path.startsWith(n.to)))?.label ?? "Page";

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-5 transition-[width] duration-200 md:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <div className={cn("mb-6 px-5", collapsed && "flex justify-center px-0")}>
          <Brand collapsed={collapsed} />
        </div>
        <NavList collapsed={collapsed} />
        <div className="mt-auto px-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-2",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-sidebar py-5">
            <div className="mb-6 flex items-center justify-between px-5">
              <Brand />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-sidebar-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur md:px-8">
          <button className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden font-semibold sm:inline">AI Workplace Productivity Assistant</span>
            <span className="hidden text-muted-foreground sm:inline">/</span>
            <span className="truncate text-muted-foreground">{current}</span>
          </div>
          <div className="ml-auto">
            <AiStatusBadge />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
