import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatEUR } from "@/lib/utils";
import { Activity, Filter, ArrowRightLeft, Award, Layers, X } from "lucide-react";
import type { KbActivity } from "@/lib/kickbase/types";
import { RefreshButton } from "./RefreshButton";

export const metadata: Metadata = { title: "Liga-Feed" };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const FILTERS = [
  { key: "all", label: "Alle" },
  { key: "transfers", label: "Transfers", icon: ArrowRightLeft },
  { key: "achievements", label: "Achievements", icon: Award },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const isTransfer = (t: number) => t === 1 || t === 2 || t === 3;
const isAchievement = (t: number) => t === 12;

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

  const allActivities = data.it ?? [];
  const activities = allActivities.filter((a) => {
    if (filter === "transfers" && !isTransfer(a.t)) return false;
    if (filter === "achievements" && !isAchievement(a.t)) return false;
    if (userFilter && a.u?.i !== userFilter) return false;
    return true;
  });

  const usersInFeed = Array.from(
    new Map(allActivities.filter((a) => a.u?.i).map((a) => [a.u!.i, a.u!] as const)).values()
  );

  const fetchedAt = new Date();
  const newestActivityDate = pickNewestActivityDate(allActivities);

  return (
    <div className="space-y-6">
      <div className="slide-up flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Activity className="size-5" />
            </span>
            Liga-Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Wer hat was gemacht — {allActivities.length} Aktivitäten
            {newestActivityDate && (
              <>
                {" · "}
                <span title={newestActivityDate.toLocaleString("de-DE")}>
                  letzte: {formatRelative(newestActivityDate)}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="text-right">
          <RefreshButton />
          <p className="text-[10px] text-muted-foreground mt-1.5 tabular" suppressHydrationWarning>
            geladen {fetchedAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap slide-up slide-up-1">
        <Filter className="size-4 text-muted-foreground" />
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const Icon = "icon" in f ? f.icon : null;
          return (
            <Link
              key={f.key}
              href={`?${new URLSearchParams({
                ...(f.key !== "all" ? { filter: f.key } : {}),
                ...(userFilter ? { user: userFilter } : {}),
              }).toString()}`}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              {f.label}
            </Link>
          );
        })}
        {userFilter && (
          <Link
            href={`?${new URLSearchParams(filter !== "all" ? { filter } : {}).toString()}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border border-primary/40 bg-primary/10 text-primary"
          >
            {usersInFeed.find((u) => u.i === userFilter)?.n ?? userFilter}
            <X className="size-3" />
          </Link>
        )}
      </div>

      {/* User filter as expandable list */}
      {!userFilter && usersInFeed.length > 0 && (
        <details className="text-xs slide-up slide-up-2">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <UserAvatar name={u.n} image={u.uim} size="xs" />
                {u.n}
              </Link>
            ))}
          </div>
        </details>
      )}

      {activities.length === 0 ? (
        <Card className="slide-up slide-up-2">
          <EmptyState
            icon={<Activity className="size-6" />}
            title="Keine Aktivitäten"
            description="In diesem Filter ist gerade nichts passiert. Probier mal »Alle«."
          />
        </Card>
      ) : (
        <Card className="slide-up slide-up-2">
          <div className="divide-y divide-border/40">
            {activities.map((a) => (
              <FeedRow key={a.i} activity={a} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function FeedRow({ activity: a }: { activity: KbActivity }) {
  const Icon = activityIconComp(a.t);
  const date = pickActivityDate(a);
  return (
    <div className="px-5 py-3.5 text-sm flex items-start gap-3">
      <UserAvatar name={a.u?.n ?? "?"} image={a.u?.uim} size="md" />
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-semibold">{a.u?.n ?? "Unbekannt"}</span>{" "}
          <span className="text-muted-foreground">{describeActivity(a)}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {isTransfer(a.t) && (
            <Badge variant="muted" className="text-[10px] gap-1">
              <ArrowRightLeft className="size-3" />
              Transfer
            </Badge>
          )}
          {isAchievement(a.t) && (
            <Badge variant="default" className="text-[10px] gap-1">
              <Award className="size-3" />
              Achievement
            </Badge>
          )}
          {date && (
            <span
              className="text-xs text-muted-foreground tabular"
              title={date.toLocaleString("de-DE")}
            >
              {formatRelative(date)}
            </span>
          )}
        </div>
      </div>
      {Icon && (
        <span className="size-9 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="size-4" />
        </span>
      )}
    </div>
  );
}

function activityIconComp(t: number) {
  if (isTransfer(t)) return ArrowRightLeft;
  if (isAchievement(t)) return Award;
  if (t === 15) return Layers;
  return null;
}

function describeActivity(a: KbActivity): string {
  const t = a.t;
  const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
  const playerName =
    (data.pn as string) ?? (data.player as string) ?? (data.name as string);
  const price = (data.prc as number) ?? (data.pric as number);

  if (t === 1)
    return playerName
      ? `kaufte ${playerName}${price ? ` für ${formatEUR(price, { compact: true })}` : ""}`
      : "tätigte einen Kauf";
  if (t === 2)
    return playerName
      ? `verkaufte ${playerName}${price ? ` für ${formatEUR(price, { compact: true })}` : ""}`
      : "verkaufte einen Spieler";
  if (t === 3) return "tätigte einen Transfer";
  if (t === 12) return "schaltete ein Achievement frei";
  if (t === 15) return "stellte eine Aufstellung";
  return `führte eine Aktivität aus (Typ ${t})`;
}

/** Extract a Date from an activity by trying many possible field names */
function pickActivityDate(a: KbActivity): Date | null {
  const candidates: unknown[] = [
    a.dt,
    a.date,
    (a as Record<string, unknown>).d,
    (a as Record<string, unknown>).t,
    (a as Record<string, unknown>).ts,
    (a as Record<string, unknown>).time,
    (a as Record<string, unknown>).timestamp,
    (a as Record<string, unknown>).cdt,
    (a as Record<string, unknown>).created,
  ];
  for (const c of candidates) {
    const d = parseFlexibleDate(c);
    if (d) return d;
  }
  return null;
}

function parseFlexibleDate(v: unknown): Date | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "number") {
    // Heuristic: < 1e11 → seconds, else ms
    const d = new Date(v < 1e11 ? v * 1000 : v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function pickNewestActivityDate(activities: KbActivity[]): Date | null {
  let best: Date | null = null;
  for (const a of activities) {
    const d = pickActivityDate(a);
    if (d && (!best || d > best)) best = d;
  }
  return best;
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 0) return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "jetzt";
  if (minutes < 60) return `vor ${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
