import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEUR, formatDelta, cn } from "@/lib/utils";
import {
  computeManagerStats,
  detectInitialBudget,
  SELL_TO_BANK_FACTOR,
  type ManagerComputedStats,
} from "@/lib/competitor";
import type { KbActivity } from "@/lib/kickbase/types";
import {
  Wallet,
  Target,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Crown,
  Trophy,
  Info,
  Swords,
} from "lucide-react";

export const metadata: Metadata = { title: "Wettbewerb" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WettbewerbPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { id: leagueId } = await params;
  const sp = await searchParams;
  const path = `/league/${leagueId}/wettbewerb`;
  const session = await requireSessionOrRedirect(path);

  const sortKey = (sp.sort ?? "cash") as
    | "cash"
    | "maxbid"
    | "tv"
    | "daygain"
    | "balance"
    | "points";

  // Step 1: get ranking + overview (small, fast)
  const [ranking, overview, activities] = await Promise.all([
    withKbAuth(path, () => kb.ranking(session.token, leagueId)).catch(() => ({} as Awaited<ReturnType<typeof kb.ranking>>)),
    withKbAuth(path, () => kb.leagueOverviewWithManagers(session.token, leagueId)).catch(() => ({} as Awaited<ReturnType<typeof kb.leagueOverviewWithManagers>>)),
    withKbAuth(path, () => kb.activities(session.token, leagueId, { max: 200 })).catch(() => ({ af: [] as KbActivity[] } as Awaited<ReturnType<typeof kb.activities>>)),
  ]);

  const members = ranking.us ?? ranking.it ?? [];
  if (members.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <Card>
          <EmptyState
            icon={<Swords className="size-6" />}
            title="Keine Liga-Mitglieder gefunden"
            description="Wir konnten die Manager-Liste nicht laden. Probier später erneut."
          />
        </Card>
      </div>
    );
  }

  const ovRecord = overview as Record<string, unknown>;
  const initialBudget = detectInitialBudget({
    overviewBudget: typeof ovRecord.b === "number" ? ovRecord.b : undefined,
  });

  const allActivities = activities.af ?? activities.it ?? [];

  // Step 2: per-manager fetch squad + transfer (parallel)
  const memberData = await Promise.all(
    members.map(async (m) => {
      const [squad, transferResp] = await Promise.all([
        withKbAuth(path, () => kb.managerSquad(session.token, leagueId, m.i)).catch(() => null),
        withKbAuth(path, () => kb.managerTransfer(session.token, leagueId, m.i)).catch(() => null),
      ]);
      return {
        manager: m,
        squad: squad ?? null,
        transfers: transferResp?.it ?? [],
      };
    })
  );

  const stats: ManagerComputedStats[] = memberData.map((d) =>
    computeManagerStats({
      userId: d.manager.i,
      name: d.manager.n,
      image: d.manager.uim,
      initialBudget,
      transfers: d.transfers,
      squad: d.squad,
      activities: allActivities,
      rankingEntry: d.manager,
    })
  );

  const me = stats.find((s) => s.userId === session.userId);
  const others = stats.filter((s) => s.userId !== session.userId);

  // Sort others by selected key
  const sorters: Record<typeof sortKey, (a: ManagerComputedStats, b: ManagerComputedStats) => number> = {
    cash: (a, b) => b.cashEstimate - a.cashEstimate,
    maxbid: (a, b) => b.maxBidSingleSell - a.maxBidSingleSell,
    tv: (a, b) => b.teamValue - a.teamValue,
    daygain: (a, b) => b.dayGain - a.dayGain,
    balance: (a, b) => b.transferBalance - a.transferBalance,
    points: (a, b) => (b.seasonPoints ?? 0) - (a.seasonPoints ?? 0),
  };
  const sortedOthers = others.slice().sort(sorters[sortKey] ?? sorters.cash);

  const SORT_TABS: Array<{ key: typeof sortKey; label: string; icon: typeof Wallet }> = [
    { key: "cash", label: "Kontostand", icon: Wallet },
    { key: "maxbid", label: "Max-Gebot", icon: Target },
    { key: "tv", label: "Teamwert", icon: Users },
    { key: "daygain", label: "Tagesgewinn", icon: TrendingUp },
    { key: "balance", label: "Transferbilanz", icon: ArrowUp },
    { key: "points", label: "Punkte", icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      <Header />

      {/* My own card (highlighted) */}
      {me && (
        <section className="slide-up">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">
            Du
          </h2>
          <ManagerCard stats={me} budget={initialBudget} highlight />
        </section>
      )}

      {/* Sort tabs */}
      <section className="slide-up slide-up-1">
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mr-1">
            Sortieren
          </span>
          {SORT_TABS.map((t) => {
            const active = sortKey === t.key;
            const Icon = t.icon;
            return (
              <Link
                key={t.key}
                href={`?sort=${t.key}`}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="size-3" />
                {t.label}
              </Link>
            );
          })}
        </div>
        <div className="grid gap-3">
          {sortedOthers.map((s) => (
            <ManagerCard key={s.userId} stats={s} budget={initialBudget} />
          ))}
        </div>
      </section>

      {/* Methodik-Hinweis */}
      <Card className="bg-primary/[0.04] border-primary/20 slide-up slide-up-2">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Info className="size-3.5 text-primary" />
            Methodik
          </div>
          <p>
            <span className="font-medium text-foreground">Kontostand</span> wird zurückgerechnet:
            Initial-Budget (
            <span className="font-mono">{formatEUR(initialBudget, { compact: true })}</span>) − Σ
            Käufe + Σ Verkäufe + Σ Boni (Spieltag-Bonus + Achievements). Manche Boni vor unserem
            Aktivitäts-Window können fehlen, daher Schätzung.
          </p>
          <p>
            <span className="font-medium text-foreground">Max-Gebot</span> nach 33 %-Regel:
            Verkauf an die Liga-Bank gibt nur 67 % des Marktwerts.{" "}
            <span className="font-mono">Cash + 0,67 × MV</span> des teuersten verkaufbaren
            Spielers. (Theoretischer Max: gesamter Squad liquidiert.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Header() {
  return (
    <div className="slide-up">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <Swords className="size-5" />
        </span>
        Wettbewerb
      </h1>
      <p className="text-sm text-muted-foreground mt-2">
        Kontostände, Max-Gebote und Transferbilanzen aller Manager — zurückgerechnet
        aus den öffentlichen Liga-Daten.
      </p>
    </div>
  );
}

function ManagerCard({
  stats,
  budget,
  highlight,
}: {
  stats: ManagerComputedStats;
  budget: number;
  highlight?: boolean;
}) {
  const balanceColor =
    stats.transferBalance > 0
      ? "text-emerald-600"
      : stats.transferBalance < 0
      ? "text-rose-600"
      : "text-muted-foreground";
  const dayColor =
    stats.dayGain > 0
      ? "text-emerald-600"
      : stats.dayGain < 0
      ? "text-rose-600"
      : "text-muted-foreground";

  return (
    <Card
      className={cn(
        "card-hover overflow-hidden relative",
        highlight && "ring-2 ring-primary/40 card-glow"
      )}
    >
      {highlight && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-emerald-300" />
      )}
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-4">
          <UserAvatar name={stats.name} image={stats.image} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{stats.name}</span>
              {stats.placement === 1 && (
                <Crown className="size-3.5 text-amber-500 shrink-0" />
              )}
              {highlight && (
                <Badge variant="default" className="text-[10px] py-0">Du</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground tabular flex items-center gap-2">
              {stats.placement !== undefined && <span>Platz #{stats.placement}</span>}
              {stats.seasonPoints !== undefined && (
                <span className="font-mono">{stats.seasonPoints.toLocaleString("de-DE")} Pkt</span>
              )}
            </div>
          </div>
          {/* Cash hero */}
          <div className="text-right shrink-0">
            <div
              className={cn(
                "text-lg sm:text-xl font-bold tabular leading-none",
                stats.cashEstimate < 0 ? "text-rose-600" : "text-foreground"
              )}
            >
              {formatEUR(stats.cashEstimate, { compact: true })}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-1">
              Kontostand
            </div>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-sm">
          <Stat
            label="Max-Gebot"
            value={formatEUR(stats.maxBidSingleSell, { compact: true })}
            icon={<Target className="size-3" />}
            tone="primary"
            sub={`bis ${formatEUR(stats.maxBidTotal, { compact: true })} max`}
          />
          <Stat
            label="Teamwert"
            value={formatEUR(stats.teamValue, { compact: true })}
            icon={<Users className="size-3" />}
            sub={`${stats.squadSize} Spieler`}
          />
          <Stat
            label="Tagesgewinn"
            value={
              <span className={dayColor}>
                {stats.dayGain ? formatDelta(stats.dayGain) : "0 €"}
              </span>
            }
            icon={
              stats.dayGain > 0 ? (
                <TrendingUp className="size-3" />
              ) : stats.dayGain < 0 ? (
                <TrendingDown className="size-3" />
              ) : (
                <TrendingUp className="size-3" />
              )
            }
            tone={stats.dayGain > 0 ? "success" : stats.dayGain < 0 ? "danger" : undefined}
          />
          <Stat
            label="Transferbilanz"
            value={
              <span className={balanceColor}>
                {stats.transferBalance ? formatDelta(stats.transferBalance) : "0 €"}
              </span>
            }
            icon={
              stats.transferBalance >= 0 ? (
                <ArrowUp className="size-3" />
              ) : (
                <ArrowDown className="size-3" />
              )
            }
            sub={`${stats.transferCount} Transfers`}
          />
        </div>

        {/* Cash composition mini-bar */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
            Wie sich der Kontostand zusammensetzt
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular">
            <span>
              Start <span className="text-foreground font-mono">{formatEUR(budget, { compact: true })}</span>
            </span>
            <span className="text-rose-600">
              − {formatEUR(stats.totalBought, { compact: true })}
            </span>
            <span className="text-emerald-600">
              + {formatEUR(stats.totalSold, { compact: true })}
            </span>
            <span className="text-amber-600">
              + {formatEUR(stats.totalBonus, { compact: true })} Bonus
            </span>
            {stats.cashUncertain && (
              <Badge variant="muted" className="text-[9px]">
                ungenau
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  icon,
  sub,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  sub?: string;
  tone?: "primary" | "success" | "danger";
}) {
  const wrap: Record<string, string> = {
    primary: "bg-primary/5 ring-primary/20",
    success: "bg-emerald-500/[0.06] ring-emerald-500/20",
    danger: "bg-rose-500/[0.06] ring-rose-500/20",
  };
  return (
    <div
      className={cn(
        "rounded-lg ring-1 ring-border px-2.5 py-2",
        tone && wrap[tone]
      )}
    >
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
        {icon}
        {label}
      </div>
      <div className="font-mono font-semibold tabular text-sm">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground tabular mt-0.5">{sub}</div>}
    </div>
  );
}
