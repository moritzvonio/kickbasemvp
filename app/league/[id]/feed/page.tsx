import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Activity, Filter } from "lucide-react";
import type { KbActivity } from "@/lib/kickbase/types";

export const metadata: Metadata = { title: "Liga-Feed" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Alle" },
  { key: "transfers", label: "Transfers" },
  { key: "achievements", label: "Achievements" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function isTransfer(t: number): boolean {
  return t === 1 || t === 2 || t === 3;
}

function isAchievement(t: number): boolean {
  return t === 12;
}

export default async function FeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string; user?: string }>;
}) {
  const { id: leagueId } = await params;
  const sp = await searchParams;
  const path = `/league/${leagueId}/feed`;
  const session = await requireSessionOrRedirect(path);

  const filter: FilterKey =
    sp.filter === "transfers" || sp.filter === "achievements" ? sp.filter : "all";
  const userFilter = sp.user;

  const data = await withKbAuth(path, () =>
    kb.activities(session.token, leagueId, { max: 100 })
  ).catch(() => ({ it: [] as KbActivity[] }));

  const activities = (data.it ?? []).filter((a) => {
    if (filter === "transfers" && !isTransfer(a.t)) return false;
    if (filter === "achievements" && !isAchievement(a.t)) return false;
    if (userFilter && a.u?.i !== userFilter) return false;
    return true;
  });

  // Build user filter chips from the unfiltered set
  const usersInFeed = Array.from(
    new Map(
      (data.it ?? [])
        .filter((a) => a.u?.i)
        .map((a) => [a.u!.i, a.u!] as const)
    ).values()
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">Liga-Feed</h1>
        <p className="text-sm text-muted-foreground">
          Wer hat was gemacht — letzte {data.it?.length ?? 0} Aktivitäten
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="size-4 text-muted-foreground" />
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`?${new URLSearchParams({
              ...(f.key !== "all" ? { filter: f.key } : {}),
              ...(userFilter ? { user: userFilter } : {}),
            }).toString()}`}
            className={cn(
              "px-3 py-1 rounded-full text-xs border transition-colors",
              filter === f.key
                ? "bg-primary/15 border-primary/40 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        ))}
        {usersInFeed.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground ml-2">·</span>
            {userFilter ? (
              <Link
                href={`?${new URLSearchParams(filter !== "all" ? { filter } : {}).toString()}`}
                className="px-3 py-1 rounded-full text-xs border border-primary/40 bg-primary/15 text-primary"
              >
                {usersInFeed.find((u) => u.i === userFilter)?.n ?? userFilter} ✕
              </Link>
            ) : (
              <select
                key={userFilter ?? "_"}
                className="text-xs px-2 py-1 rounded-full border border-border bg-background text-muted-foreground"
                defaultValue=""
                aria-label="Nach Mitspieler filtern"
                disabled
              >
                <option value="">Mitspieler …</option>
                {usersInFeed.slice(0, 30).map((u) => (
                  <option key={u.i} value={u.i}>{u.n}</option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      {/* User filter quick-links (replace disabled select with a list of links) */}
      {!userFilter && usersInFeed.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Nach Mitspieler filtern …
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {usersInFeed.map((u) => (
              <Link
                key={u.i}
                href={`?${new URLSearchParams({
                  ...(filter !== "all" ? { filter } : {}),
                  user: u.i,
                }).toString()}`}
                className="px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {u.n}
              </Link>
            ))}
          </div>
        </details>
      )}

      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Activity className="size-8 mx-auto mb-3 opacity-40" />
            Keine Aktivitäten in diesem Filter.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-border/40">
            {activities.map((a) => (
              <div key={a.i} className="px-5 py-3 text-sm flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div>
                    <span className="font-medium">{a.u?.n ?? "Unbekannt"}</span>{" "}
                    <span className="text-muted-foreground">{describeActivity(a)}</span>
                  </div>
                  {isTransfer(a.t) && (
                    <Badge variant="muted" className="mt-1 text-[10px]">Transfer</Badge>
                  )}
                  {isAchievement(a.t) && (
                    <Badge variant="default" className="mt-1 text-[10px]">Achievement</Badge>
                  )}
                </div>
                {a.dt && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {formatActivityDate(a.dt)}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function describeActivity(a: KbActivity): string {
  const t = a.t;
  const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
  const playerName = (data.pn as string) ?? (data.player as string);

  if (t === 1) return playerName ? `kaufte ${playerName}` : "tätigte einen Kauf";
  if (t === 2) return playerName ? `verkaufte ${playerName}` : "verkaufte einen Spieler";
  if (t === 3) return "tätigte einen Transfer";
  if (t === 12) return "schaltete ein Achievement frei";
  if (t === 15) return "stellte eine Aufstellung";
  return `führte eine Aktivität aus (Typ ${t})`;
}

function formatActivityDate(dt: number | string): string {
  let date: Date;
  if (typeof dt === "string") {
    date = new Date(dt);
  } else {
    date = new Date(dt < 1e11 ? dt * 1000 : dt);
  }
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "jetzt";
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} Std`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}
