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

export function LeagueTabs({ leagueId }: { leagueId: string }) {
  const pathname = usePathname();
  const tabs: Tab[] = [
    { href: `/league/${leagueId}`, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: `/league/${leagueId}/aufstellung`, label: "Aufstellung", icon: ClipboardList },
    { href: `/league/${leagueId}/trading`, label: "Trading", icon: TrendingUp },
    { href: `/league/${leagueId}/wettbewerb`, label: "Wettbewerb", icon: Swords },
    { href: `/league/${leagueId}/markt`, label: "Markt", icon: ShoppingCart },
    { href: `/league/${leagueId}/news`, label: "News", icon: Newspaper },
    { href: `/league/${leagueId}/top-spieler`, label: "Top 50", icon: Trophy },
    { href: `/league/${leagueId}/watchlist`, label: "Watchlist", icon: Star },
    { href: `/league/${leagueId}/feed`, label: "Liga-Feed", icon: Activity },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-3">
      <nav
        className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/60 ring-1 ring-border max-w-full overflow-x-auto scrollbar-none"
        role="tablist"
        aria-label="Liga-Navigation"
      >
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              role="tab"
              aria-selected={active}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all",
                active
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-4", active && "text-primary")} />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
