import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { TeamTag } from "@/components/ui/team-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatEUR, formatDelta } from "@/lib/utils";
import {
  Activity,
  Filter,
  ArrowRightLeft,
  Award,
  Layers,
  X,
  Wallet,
  ShoppingCart,
  Building2,
} from "lucide-react";
import type {
  KbActivity,
  KbManagerTransfer,
  KbRankingUser,
} from "@/lib/kickbase/types";
import { RefreshButton } from "./RefreshButton";

export const metadata: Metadata = { title: "Liga-Feed" };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const FILTERS = [
  { key: "all", label: "Alle" },
  { key: "transfers", label: "Transfers", icon: ArrowRightLeft },
  { key: "boni", label: "Boni", icon: Wallet },
  { key: "achievements", label: "Achievements", icon: Award },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const isAchievement = (t: number) => t === 12 || t === 13;
const isBonus = (t: number) => t === 22;

/** Bot/agent name that signals "sold to / bought from the league bank" */
const BANK_BOT_NAMES = new Set(["Mino Raiola", "KI Spielerverkauf", "KI"]);
function isBankCounterparty(name?: string): boolean {
  if (!name) return false;
  if (BANK_BOT_NAMES.has(name)) return true;
  // Heuristic: starts with "KI " or contains "Liga"
  return /^KI(?:\s|$)/i.test(name) || /\bLiga\b/i.test(name);
}

interface TransferEntry {
  kind: "transfer";
  date: Date;
  user: { i: string; n: string; uim?: string };
  transfer: KbManagerTransfer;
}
interface ActivityEntry {
  kind: "activity";
  date: Date;
  activity: KbActivity;
}
type FeedEntry = TransferEntry | ActivityEntry;

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
    sp.filter === "transfers" ||
    sp.filter === "boni" ||
    sp.filter === "achievements"
      ? sp.filter
      : "all";
  const userFilter = sp.user;

  // Fetch ranking + activities first
  const [ranking, activitiesData] = await Promise.all([
    withKbAuth(path, () => kb.ranking(session.token, leagueId)).catch(
      () => ({} as Awaited<ReturnType<typeof kb.ranking>>)
    ),
    withKbAuth(path, () => kb.activities(session.token, leagueId, { max: 200 })).catch(
      () => ({ af: [] as KbActivity[] } as Awaited<ReturnType<typeof kb.activities>>)
    ),
  ]);

  const members: KbRankingUser[] = ranking.us ?? ranking.it ?? [];

  // Per-manager transfer history (parallel)
  const transferLists = await Promise.all(
    members.map(async (m) => {
      try {
        const r = await kb.managerTransfer(session.token, leagueId, m.i);
        return { user: m, transfers: r.it ?? [] };
      } catch {
        return { user: m, transfers: [] as KbManagerTransfer[] };
      }
    })
  );

  // Build entries
  const transferEntries: TransferEntry[] = transferLists.flatMap(
    ({ user, transfers }) =>
      transfers.map<TransferEntry>((t) => ({
        kind: "transfer",
        date: new Date(t.dt),
        user: { i: user.i, n: user.n, uim: user.uim },
        transfer: t,
      }))
  );

  const allActivities = activitiesData.af ?? activitiesData.it ?? [];
  const activityEntries: ActivityEntry[] = allActivities
    .map((a) => ({ kind: "activity" as const, date: pickActivityDate(a), activity: a }))
    .filter((e): e is ActivityEntry => e.date !== null && e.date !== undefined) as ActivityEntry[];

  // De-duplicate transfers vs activity-feed transfers
  // (activity feed sometimes contains the same transfer)
  // We keep the rich transfer entry and drop duplicate activity if t=1/2/3/15/16
  const transferKeys = new Set(
    transferEntries.map((e) => `${e.user.i}|${e.transfer.pi}|${e.transfer.dt}`)
  );
  const dedupedActivities = activityEntries.filter((e) => {
    const t = e.activity.t;
    if (t === 1 || t === 2 || t === 3 || t === 15 || t === 16) {
      // skip activity-feed transfers – we have the rich version
      return false;
    }
    return true;
  });

  const merged: FeedEntry[] = [...transferEntries, ...dedupedActivities].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  // Apply filters
  const filtered = merged.filter((e) => {
    if (userFilter) {
      if (e.kind === "transfer" && e.user.i !== userFilter) return false;
      if (e.kind === "activity" && e.activity.u?.i !== userFilter) return false;
    }
    if (filter === "transfers" && e.kind !== "transfer") return false;
    if (filter === "boni") {
      return e.kind === "activity" && isBonus(e.activity.t);
    }
    if (filter === "achievements") {
      return e.kind === "activity" && isAchievement(e.activity.t);
    }
    return true;
  });

  const display = filtered.slice(0, 80);

  // Derive user list (from transfers + activities) for filter dropdown
  const userMap = new Map<string, { i: string; n: string; uim?: string }>();
  for (const m of members) userMap.set(m.i, { i: m.i, n: m.n, uim: m.uim });

  const fetchedAt = new Date();

  // Stats for header
  const stats = {
    transfers: merged.filter((e) => e.kind === "transfer").length,
    boni: merged.filter((e) => e.kind === "activity" && isBonus(e.activity.t)).length,
    achievements: merged.filter((e) => e.kind === "activity" && isAchievement(e.activity.t))
      .length,
  };

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
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-3 flex-wrap">
            <span>{stats.transfers} Transfers</span>
            <span>· {stats.boni} Boni</span>
            <span>· {stats.achievements} Achievements</span>
          </p>
        </div>
        <div className="text-right">
          <RefreshButton />
          <p
            className="text-[10px] text-muted-foreground mt-1.5 tabular"
            suppressHydrationWarning
          >
            geladen{" "}
            {fetchedAt.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
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
            {userMap.get(userFilter)?.n ?? userFilter}
            <X className="size-3" />
          </Link>
        )}
      </div>

      {/* User filter expandable */}
      {!userFilter && userMap.size > 0 && (
        <details className="text-xs slide-up slide-up-2">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Nach Mitspieler filtern …
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Array.from(userMap.values()).map((u) => (
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

      {display.length === 0 ? (
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
            {display.map((e, i) =>
              e.kind === "transfer" ? (
                <TransferRow
                  key={`t-${e.user.i}-${e.transfer.pi}-${e.transfer.dt}-${i}`}
                  entry={e}
                  leagueId={leagueId}
                />
              ) : (
                <ActivityRowComponent
                  key={`a-${e.activity.i}-${i}`}
                  entry={e}
                />
              )
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function TransferRow({
  entry,
  leagueId,
}: {
  entry: TransferEntry;
  leagueId: string;
}) {
  const t = entry.transfer;
  const isBuy = t.tty === 1;
  const verb = isBuy ? "kaufte" : "verkaufte";
  const counter = t.othnm;
  const counterIsBank = isBankCounterparty(counter);
  const preposition = isBuy ? (counterIsBank ? "aus dem Markt" : counter ? `von ${counter}` : "") : counterIsBank ? "an die Liga" : counter ? `an ${counter}` : "";

  return (
    <div className="px-5 py-3.5 text-sm flex items-start gap-3">
      <UserAvatar name={entry.user.n} image={entry.user.uim} size="md" />
      <div className="flex-1 min-w-0">
        <div className="text-sm flex flex-wrap items-center gap-x-1 gap-y-0.5">
          <span className="font-semibold">{entry.user.n}</span>
          <span className={cn("font-medium", isBuy ? "text-emerald-700" : "text-rose-700")}>
            {verb}
          </span>
          <Link
            href={`/league/${leagueId}/spieler/${t.pi}`}
            className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors"
          >
            <PlayerAvatar pim={t.pim} tid={t.tid} size={22} />
            {t.pn}
          </Link>
          <TeamTag tid={t.tid} size="xs" />
          {preposition && (
            <span className="text-muted-foreground">{preposition}</span>
          )}
          <span className="text-muted-foreground">für</span>
          <span className="font-mono font-semibold tabular">
            {formatEUR(t.trp, { compact: true })}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge
            variant={isBuy ? "success" : "danger"}
            className="text-[10px] gap-1"
          >
            {isBuy ? <ShoppingCart className="size-3" /> : <ArrowRightLeft className="size-3" />}
            {isBuy ? "Kauf" : "Verkauf"}
          </Badge>
          {counterIsBank && (
            <Badge variant="muted" className="text-[10px] gap-1">
              <Building2 className="size-3" />
              Liga-Bank
            </Badge>
          )}
          <span
            className="text-xs text-muted-foreground tabular"
            title={entry.date.toLocaleString("de-DE")}
          >
            {formatRelative(entry.date)}
          </span>
        </div>
      </div>
      <div
        className={cn(
          "size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          isBuy ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
        )}
      >
        {isBuy ? <ShoppingCart className="size-4" /> : <ArrowRightLeft className="size-4" />}
      </div>
    </div>
  );
}

function ActivityRowComponent({ entry }: { entry: ActivityEntry }) {
  const a = entry.activity;
  const Icon = activityIconComp(a.t);
  const hasUser = !!a.u?.n;
  const description = describeActivityFromData(a);
  return (
    <div className="px-5 py-3.5 text-sm flex items-start gap-3">
      {hasUser ? (
        <UserAvatar name={a.u!.n} image={a.u!.uim} size="md" />
      ) : (
        <span className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/20">
          {Icon ? <Icon className="size-4" /> : <Activity className="size-4" />}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          {hasUser && <span className="font-semibold">{a.u!.n}</span>}
          {hasUser ? " " : ""}
          <span className={hasUser ? "text-muted-foreground" : "font-medium"}>
            {description}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {isBonus(a.t) && (
            <Badge variant="default" className="text-[10px] gap-1">
              <Wallet className="size-3" />
              Bonus
            </Badge>
          )}
          {isAchievement(a.t) && (
            <Badge variant="default" className="text-[10px] gap-1">
              <Award className="size-3" />
              Achievement
            </Badge>
          )}
          <span
            className="text-xs text-muted-foreground tabular"
            title={entry.date.toLocaleString("de-DE")}
          >
            {formatRelative(entry.date)}
          </span>
        </div>
      </div>
      {hasUser && Icon && (
        <span className="size-9 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="size-4" />
        </span>
      )}
    </div>
  );
}

function activityIconComp(t: number) {
  if (isBonus(t)) return Wallet;
  if (isAchievement(t)) return Award;
  if (t === 15) return Layers;
  return null;
}

function describeActivityFromData(a: KbActivity): string {
  const t = a.t;
  const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
  const bonus = data.bn as number | undefined;
  const day = data.day as number | undefined;
  if (isBonus(t) || bonus !== undefined) {
    return bonus !== undefined
      ? `erhielt ${formatEUR(bonus, { compact: true })} Bonus${day ? ` (Spieltag ${day})` : ""}`
      : "erhielt einen Bonus";
  }
  if (isAchievement(t)) {
    const aname = (data.aname as string) ?? (data.name as string) ?? (data.title as string);
    return aname ? `schaltete »${aname}« frei` : "schaltete ein Achievement frei";
  }
  if (t === 26) return "Liga-Aktivität";
  return `Aktivität (Typ ${t})`;
}

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
    const d = new Date(v < 1e11 ? v * 1000 : v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
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
