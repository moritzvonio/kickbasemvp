"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Activity,
  Star,
  ClipboardList,
  Trophy,
  Swords,
  TrendingUp,
  Newspaper,
} from "lucide-react";

interface Tab {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

interface TabGroup {
  label: string;
  tabs: Tab[];
}

export function LeagueTabs({ leagueId }: { leagueId: string }) {
  const pathname = usePathname();

  const groups: TabGroup[] = [
    {
      label: "Liga",
      tabs: [
        { href: `/league/${leagueId}`, label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: `/league/${leagueId}/wettbewerb`, label: "Wettbewerb", icon: Swords },
        { href: `/league/${leagueId}/feed`, label: "Liga-Feed", icon: Activity },
      ],
    },
    {
      label: "Mannschaft",
      tabs: [
        { href: `/league/${leagueId}/aufstellung`, label: "Aufstellung", icon: ClipboardList },
      ],
    },
    {
      label: "Transfers",
      tabs: [
        { href: `/league/${leagueId}/markt`, label: "Markt", icon: ShoppingCart },
        { href: `/league/${leagueId}/trading`, label: "Trading", icon: TrendingUp },
        { href: `/league/${leagueId}/watchlist`, label: "Watchlist", icon: Star },
      ],
    },
    {
      label: "Bundesliga",
      tabs: [
        { href: `/league/${leagueId}/news`, label: "News", icon: Newspaper },
        { href: `/league/${leagueId}/top-spieler`, label: "Top 50", icon: Trophy },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-3">
      <nav
        className="flex items-stretch max-w-full overflow-x-auto scrollbar-none gap-2"
        role="tablist"
        aria-label="Liga-Navigation"
      >
        {groups.map((group) => {
          const groupHasActive = group.tabs.some((t) =>
            t.exact ? pathname === t.href : pathname.startsWith(t.href)
          );
          return (
            <div
              key={group.label}
              className={cn(
                "flex flex-col shrink-0 rounded-2xl px-2 pt-1.5 pb-1.5 transition-all ring-1",
                groupHasActive
                  ? "bg-card ring-primary/40 shadow-[0_2px_12px_-2px_rgba(16,185,129,0.18)]"
                  : "bg-muted/30 ring-border/60 hover:bg-muted/60 hover:ring-border"
              )}
            >
              <span
                className={cn(
                  "text-[9px] uppercase tracking-[0.16em] font-bold select-none px-2 mb-1 transition-colors",
                  groupHasActive ? "text-primary" : "text-muted-foreground/75"
                )}
              >
                {group.label}
              </span>
              <div className="flex items-center gap-0.5">
                {group.tabs.map((t) => {
                  const active = t.exact
                    ? pathname === t.href
                    : pathname.startsWith(t.href);
                  const Icon = t.icon;
                  return (
                    <Link
                      key={t.href}
                      href={t.href}
                      role="tab"
                      aria-selected={active}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-all",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm [&_svg]:text-primary-foreground"
                          : groupHasActive
                          ? "text-foreground/75 hover:text-foreground hover:bg-muted/70"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                      )}
                    >
                      <Icon className="size-3.5" />
                      {t.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
