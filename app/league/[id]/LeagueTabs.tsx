"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingCart, Activity, Lock } from "lucide-react";

export function LeagueTabs({ leagueId }: { leagueId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/league/${leagueId}`, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: `/league/${leagueId}/markt`, label: "Markt", icon: ShoppingCart, soon: true },
    { href: `/league/${leagueId}/feed`, label: "Liga-Feed", icon: Activity, soon: true },
  ];
  return (
    <nav className="mx-auto max-w-5xl px-4 flex items-center gap-1 -mt-px overflow-x-auto">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {t.label}
            {t.soon && (
              <span className="text-[10px] text-muted-foreground">
                <Lock className="size-3 inline -mt-0.5" />
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
