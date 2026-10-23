"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpen, CalendarDays, ChartNoAxesCombined, ClipboardCheck, FlaskConical, LayoutDashboard, LogOut, NotebookPen, Plus, Settings, Upload, Menu } from "lucide-react";
import { logout } from "@/app/actions";
import { SubmitButton } from "@/components/confirm-submit-button";
import { NavigationLink } from "@/components/navigation-link";
type NavItem = { label: string; icon: LucideIcon; href: string };
type NavGroup = { label: string; items: NavItem[] };
const groups: NavGroup[] = [
  { label: "Daily routine", items: [
    { label: "Today & overview", icon: LayoutDashboard, href: "/app" },
    { label: "Daily bias & plans", icon: NotebookPen, href: "/app/plans" },
    { label: "Trade journal", icon: BookOpen, href: "/app/journal" },
    { label: "Reviews", icon: ChartNoAxesCombined, href: "/app/reviews" },
  ] },
  { label: "Study & improve", items: [
    { label: "Reports", icon: BarChart3, href: "/app/analytics" },
    { label: "Calendar", icon: CalendarDays, href: "/app/calendar" },
    { label: "Strategies", icon: ClipboardCheck, href: "/app/playbooks" },
    { label: "Backtesting", icon: FlaskConical, href: "/app/backtests" },
  ] },
  { label: "Manage", items: [
    { label: "Import trades", icon: Upload, href: "/app/import" },
    { label: "Settings", icon: Settings, href: "/app/settings" },
  ] },
];
const allItems = groups.flatMap(group => group.items);
const mobileLabels = ["Today", "Bias", "Trades", "Reviews"];
export function AppShell({ children, name }: { children: React.ReactNode; name?: string | null }) {
  const pathname = usePathname();
  const active = (href: string) => href === "/app" ? pathname === href : pathname.startsWith(href);
  const current = allItems.find(item => active(item.href));
  return <div className="shell trade-workspace">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar">
      <Link href="/app" className="brand"><span className="brand-mark">T</span><span>TFX<span>Zella</span></span></Link>
      <div className="account-switcher"><span className="account-avatar">{name?.[0]?.toUpperCase() || "T"}</span><div><b>{name || "Trader"}</b><small>Trading workspace</small></div></div>
      <nav className="nav grouped-nav" aria-label="Main navigation">{groups.map(group => <section key={group.label}>
        <span className="nav-label">{group.label}</span>{group.items.map(item => { const Icon = item.icon; return <NavigationLink aria-current={active(item.href) ? "page" : undefined} className={active(item.href) ? "active" : ""} key={item.href} href={item.href}><Icon size={17}/><span>{item.label}</span></NavigationLink>; })}
      </section>)}</nav>
      <form action={logout} className="sidebar-foot"><SubmitButton className="sidebar-logout" pendingLabel="Logging out…"><LogOut size={16}/>Log out</SubmitButton></form>
    </aside>
    <main className="main" id="main-content" tabIndex={-1}>
      <header className="topbar"><div><span className="topbar-title">{current?.label || "Today & overview"}</span><span className="topbar-subtitle">Prepare · execute · reflect</span></div><div className="topbar-actions"><NavigationLink className="btn secondary" href="/app/import"><Upload size={15}/>Import</NavigationLink><NavigationLink className="btn" href="/app/journal/new"><Plus size={16}/>Log trade</NavigationLink></div></header>
      {children}
    </main>
    <nav className="mobile-nav routine-mobile-nav" aria-label="Mobile navigation">
      {groups[0].items.map((item, index) => { const Icon = item.icon; return <NavigationLink aria-current={active(item.href) ? "page" : undefined} className={active(item.href) ? "active" : ""} key={item.href} href={item.href}><Icon size={19}/><span>{mobileLabels[index]}</span></NavigationLink>; })}
      <details className="mobile-more" key={pathname}>
        <summary className={groups.slice(1).some(group => group.items.some(item => active(item.href))) ? "active" : ""}><Menu size={19}/><span>More</span></summary>
        <div className="mobile-more-panel">{groups.slice(1).map(group => <section key={group.label}><span className="stat-label">{group.label}</span>{group.items.map(item => { const Icon = item.icon; return <NavigationLink key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined}><Icon size={18}/>{item.label}</NavigationLink>; })}</section>)}<form action={logout}><SubmitButton className="sidebar-logout" pendingLabel="Logging out…"><LogOut size={16}/>Log out</SubmitButton></form></div>
      </details>
    </nav>
  </div>;
}
