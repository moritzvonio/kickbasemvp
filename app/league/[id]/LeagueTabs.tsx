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
    <div className="mx-auto max-w-6xl px-4 pb-3">
      <nav
        className="flex items-center max-w-full overflow-x-auto scrollbar-none gap-3 sm:gap-5"
        role="tablist"
        aria-label="Liga-Navigation"
      >
        {groups.map((group, gi) => (
          <div
            key={group.label}
            className="flex items-center gap-2 sm:gap-3 shrink-0"
          >
            {gi > 0 && (
              <span
                aria-hidden
                className="h-5 w-px bg-border/50 shrink-0"
              />
            )}
            <span
              className="text-[9px] uppercase tracking-[0.12em] font-semibold text-muted-foreground/55 select-none shrink-0 hidden sm:inline"
              title={group.label}
            >
              {group.label}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
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
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs sm:text-[13px] font-medium whitespace-nowrap transition-colors",
                      active
                        ? "bg-primary/10 text-primary ring-1 ring-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
