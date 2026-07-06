"use client";

/**
 * Mobile Bottom-Navigation (< md). Ersetzt auf kleinen Viewports die horizontal
 * scrollende Tab-Leiste, die ohne Affordance nicht entdeckbar ist. In der PWA
 * ist sie die Hauptnavigation. Liga-Kontext kommt aus der URL (/league/[id]/…).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Swords,
  ShoppingCart,
  Newspaper,
  MoreHorizontal,
  X,
  ClipboardList,
  TrendingUp,
  Star,
  Activity,
  Trophy,
  Settings,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const m = pathname.match(/^\/league\/([^/]+)/);
  const leagueId = m?.[1];
  const base = leagueId ? `/league/${leagueId}` : "";

  const primary = [
    {
      href: leagueId ? base : "/leagues",
      label: "Start",
      icon: LayoutDashboard,
      active: leagueId ? pathname === base : pathname.startsWith("/leagues"),
    },
    {
      href: leagueId ? `${base}/wettbewerb` : "/leagues",
      label: "Wettbewerb",
      icon: Swords,
      active: !!leagueId && pathname.startsWith(`${base}/wettbewerb`),
    },
    {
      href: leagueId ? `${base}/markt` : "/leagues",
      label: "Markt",
      icon: ShoppingCart,
      active: !!leagueId && pathname.startsWith(`${base}/markt`),
    },
    {
      href: leagueId ? `${base}/news` : "/news",
      label: "News",
      icon: Newspaper,
      active: leagueId ? pathname.startsWith(`${base}/news`) : pathname.startsWith("/news"),
    },
  ];

  const more = leagueId
    ? [
        { href: `${base}/aufstellung`, label: "Aufstellung", icon: ClipboardList },
        { href: `${base}/trading`, label: "Trading", icon: TrendingUp },
        { href: `${base}/watchlist`, label: "Watchlist", icon: Star },
        { href: `${base}/feed`, label: "Liga-Feed", icon: Activity },
        { href: `${base}/top-spieler`, label: "Top 50", icon: Trophy },
        { href: "/account", label: "Account", icon: Settings },
      ]
    : [
        { href: "/leagues", label: "Ligen", icon: Trophy },
        { href: "/account", label: "Account", icon: Settings },
      ];

  return (
    <>
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-label="Mehr">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Schließen"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-background border-t border-border p-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Mehr</span>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Schließen"
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {more.map((l) => {
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 min-h-[64px] justify-center text-xs font-medium hover:bg-accent transition-colors"
                  >
                    <Icon className="size-5 text-primary" />
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Hauptnavigation"
      >
        <div className="grid grid-cols-5 h-16">
          {primary.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.label}
                href={it.href}
                aria-current={it.active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  it.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {it.active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
                )}
                <Icon className="size-5" />
                {it.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              moreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Mehr anzeigen"
          >
            <MoreHorizontal className="size-5" />
            Mehr
          </button>
        </div>
      </nav>
    </>
  );
}
