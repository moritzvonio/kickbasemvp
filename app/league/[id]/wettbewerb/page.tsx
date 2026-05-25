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
import type { KbActivity, KbRankingUser } from "@/lib/kickbase/types";
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
  LineChart as LineChartIcon,
} from "lucide-react";
import { TeamValueChart, type TVChartPoint } from "./TeamValueChart";
import { ActivityTypeDebug } from "./activity-debug";

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

  const sortKey = (sp.sort ?? "netto") as
    | "netto"
    | "cash"
    | "maxbid"
    | "tv"
    | "daygain"
    | "balance"
    | "points";

  // Step 1: get ranking + overview + ALL activities + own achievements + REAL OWN BUDGET
  const [ranking, overview, allActivitiesArr, ownAchievements, myRealBudget] = await Promise.all([
    withKbAuth(path, () => kb.ranking(session.token, leagueId)).catch(() => ({} as Awaited<ReturnType<typeof kb.ranking>>)),
    withKbAuth(path, () => kb.leagueOverviewWithManagers(session.token, leagueId)).catch(() => ({} as Awaited<ReturnType<typeof kb.leagueOverviewWithManagers>>)),
    withKbAuth(path, () => kb.activitiesAll(session.token, leagueId)).catch(() => [] as KbActivity[]),
    withKbAuth(path, () => kb.userAchievementsTotal(session.token, leagueId)).catch(() => ({ items: [], total: 0 })),
    withKbAuth(path, () => kb.myBudget(session.token, leagueId)).catch(() => null),
  ]);
  const activities: { af?: KbActivity[]; it?: KbActivity[] } = { af: allActivitiesArr };

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

  // Step 2: per-manager fetch squad + ALL transfers (paginated, parallel)
  const memberData = await Promise.all(
    members.map(async (m) => {
      const [squad, transfers] = await Promise.all([
        withKbAuth(path, () => kb.managerSquad(session.token, leagueId, m.i)).catch(() => null),
        withKbAuth(path, () => kb.managerTransferAll(session.token, leagueId, m.i)).catch(() => []),
      ]);
      return {
        manager: m,
        squad: squad ?? null,
        transfers,
      };
    })
  );

  const transferLists = memberData.map((d) => ({
    user: d.manager,
    transfers: d.transfers,
  }));

  // Per-Matchday-Rankings einmal fetchen (für Chart UND Matchday-Bonus-Berechnung)
  const currentMatchday =
    typeof ranking.day === "number" ? ranking.day : undefined;
  const matchdaysToFetch: number[] = [];
  if (currentMatchday && currentMatchday >= 1) {
    for (let d = 1; d <= currentMatchday; d++) matchdaysToFetch.push(d);
  }
  const perMatchdayRankings = await Promise.all(
    matchdaysToFetch.map((d) =>
      kb
        .ranking(session.token, leagueId, d)
        .then((r) => r.us ?? r.it ?? [])
        .catch(() => [] as KbRankingUser[])
    )
  );

  const meRealCash = myRealBudget?.b !== undefined ? myRealBudget.b : undefined;

  const stats: ManagerComputedStats[] = memberData.map((d) => {
    const isMe = d.manager.i === session.userId;
    return computeManagerStats({
      userId: d.manager.i,
      name: d.manager.n,
      image: d.manager.uim,
      initialBudget,
      transfers: d.transfers,
      squad: d.squad,
      activities: allActivities,
      rankingEntry: d.manager,
      perMatchdayRankings,
      achievements: isMe ? ownAchievements : undefined,
      realCashFromApi: isMe ? meRealCash : undefined,
    });
  });

  const me = stats.find((s) => s.userId === session.userId);
  const others = stats.filter((s) => s.userId !== session.userId);

  // Sort others by selected key
  const sorters: Record<typeof sortKey, (a: ManagerComputedStats, b: ManagerComputedStats) => number> = {
    netto: (a, b) => b.netTeamValue - a.netTeamValue,
    cash: (a, b) => b.cashEstimate - a.cashEstimate,
    maxbid: (a, b) => b.maxBidSingleSell - a.maxBidSingleSell,
    tv: (a, b) => b.teamValue - a.teamValue,
    daygain: (a, b) => b.dayGain - a.dayGain,
    balance: (a, b) => b.transferBalance - a.transferBalance,
    points: (a, b) => (b.seasonPoints ?? 0) - (a.seasonPoints ?? 0),
  };
  const sortedOthers = others.slice().sort(sorters[sortKey] ?? sorters.netto);

  const SORT_TABS: Array<{ key: typeof sortKey; label: string; icon: typeof Wallet }> = [
    { key: "netto", label: "Netto-Teamwert", icon: TrendingUp },
    { key: "cash", label: "Kontostand", icon: Wallet },
    { key: "maxbid", label: "Max-Gebot", icon: Target },
    { key: "tv", label: "Teamwert", icon: Users },
    { key: "daygain", label: "Tagesgewinn", icon: ArrowUp },
    { key: "balance", label: "Transferbilanz", icon: ArrowUp },
    { key: "points", label: "Punkte", icon: Trophy },
  ];

  // Step 3: Build chart data using already-fetched per-matchday rankings
  const tvChartData = buildTeamValueChartData({
    members,
    transferLists,
    bonusActivities: allActivities,
    initialBudget,
    matchdaysToFetch,
    perMatchdayRankings,
  });

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

      {/* Netto-Teamwert chart */}
      {tvChartData.data.length >= 2 && (
        <section className="slide-up slide-up-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <LineChartIcon className="size-4" />
                </span>
                Netto-Teamwert-Verlauf
                <Badge variant="muted" className="ml-auto text-[10px]">
                  {tvChartData.data.length} Spieltage
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TeamValueChart
                data={tvChartData.data}
                managers={tvChartData.managers}
                highlightUserId={session.userId}
              />
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Pro Spieltag: Σ Marktwert deines Squads + Cash (Initial − Käufe + Verkäufe + Boni + Punkteprämie 1k€/Pkt bis dahin).
                <br />
                <span className="font-mono">build: 3a3954e+points-fix · {new Date().toISOString().slice(0, 16)}</span>
              </p>

              {/* Live-Backtest: MD 1 Komponenten aufgeschlüsselt (tv + cash) */}
              <details className="mt-4 text-xs" open>
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                  🔬 Backtest MD 1 Komponenten — sollte für alle: tv ~100 Mio + cash 50 Mio = ~150 Mio
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-[11px] tabular">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left py-1 pr-3">Manager</th>
                        <th className="text-right py-1 pr-3">tv (aus ranking MD 1)</th>
                        <th className="text-right py-1 pr-3">MD 1 Netto</th>
                        <th className="text-right py-1 pr-3">tv-150 Diff</th>
                        <th className="text-right py-1">Aktueller MD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perMatchdayRankings[0]?.map((u) => {
                        const tv = u.tv ?? 0;
                        const md1Netto = Number(
                          tvChartData.data[0]?.[u.n] ?? 0
                        );
                        const nowNetto = Number(
                          tvChartData.data[tvChartData.data.length - 1]?.[u.n] ?? 0
                        );
                        const tvDiff = tv - 100_000_000;
                        return (
                          <tr key={u.i} className="border-b border-border/30">
                            <td className="py-1 pr-3 truncate max-w-[180px]">{u.n}</td>
                            <td className="text-right py-1 pr-3 font-mono">
                              {(tv / 1_000_000).toFixed(1)}
                            </td>
                            <td className="text-right py-1 pr-3 font-mono font-semibold">
                              {(md1Netto / 1_000_000).toFixed(1)}
                            </td>
                            <td
                              className={
                                "text-right py-1 pr-3 font-mono " +
                                (Math.abs(tvDiff) < 5_000_000
                                  ? "text-emerald-700"
                                  : Math.abs(tvDiff) < 20_000_000
                                  ? "text-amber-700"
                                  : "text-rose-700")
                              }
                            >
                              {tvDiff >= 0 ? "+" : ""}
                              {(tvDiff / 1_000_000).toFixed(1)}
                            </td>
                            <td className="text-right py-1 font-mono">
                              {(nowNetto / 1_000_000).toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Wenn tv-Spalte für alle ähnlich hoch wie aktueller Teamwert ist
                  (statt ~100 Mio), liefert <code>kb.ranking(day=1)</code> den
                  aktuellen tv zurück, NICHT den historischen → API-Quirk.
                </p>
              </details>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Sort tabs */}
      <section className="slide-up slide-up-2">
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
        {/* Große Vergleichs-Tabelle (alle Manager, alle Stats nebeneinander) */}
        <CompareTable
          stats={[me, ...sortedOthers].filter(Boolean) as ManagerComputedStats[]}
          myUserId={session.userId}
        />

        {/* Detail-Cards (klassische Card-Ansicht für Drill-Down) */}
        <details className="mt-6">
          <summary className="cursor-pointer text-xs uppercase tracking-wider text-muted-foreground font-semibold hover:text-foreground py-2">
            Detail-Karten anzeigen ({sortedOthers.length} Manager)
          </summary>
          <div className="grid gap-3 mt-3">
            {sortedOthers.map((s) => (
              <ManagerCard key={s.userId} stats={s} budget={initialBudget} />
            ))}
          </div>
        </details>
      </section>

      {/* Activity-Type Debug — zeigt was wirklich im Feed steht */}
      <Card className="bg-amber-50/30 border-amber-200 slide-up slide-up-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm mb-1">
            🔬 Activity-Feed-Inspektor
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Alle paginierten Aktivitäten ({allActivities.length} Events) gruppiert nach{" "}
            <code className="font-mono">t</code>-Code mit allen numerischen Feldern.
            Hilft Bonus-Kategorien zu finden die wir aktuell verpassen.
          </p>
          <ActivityTypeDebug activities={allActivities} />
        </CardContent>
      </Card>

      {/* Methodik-Hinweis */}
      <Card className="bg-primary/[0.04] border-primary/20 slide-up slide-up-2">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-2.5">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Info className="size-3.5 text-primary" />
            Methodik der Cash-Berechnung
          </div>
          <div>
            <span className="font-medium text-foreground">Initial-Budget</span>:{" "}
            <span className="font-mono text-foreground">{formatEUR(initialBudget, { compact: true })}</span>{" "}
            (aus Liga-Setting). Cash = Initial − Käufe + Verkäufe + alle Boni.
          </div>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
            <div>
              <span className="font-medium text-foreground">📊 Exakt aus Kickbase:</span>
              <ul className="list-disc ml-4 mt-1">
                <li><span className="text-emerald-700 font-semibold">Eigener Cash</span>: direkt aus <code className="font-mono">/me/budget</code> — keine Schätzung nötig</li>
                <li>Alle Käufe + Verkäufe seit Liga-Start (paginiert)</li>
                <li>Eigene Erfolge: Σ ac × er aus <code className="font-mono">/user/achievements</code></li>
              </ul>
            </div>
            <div>
              <span className="font-medium text-foreground">🧮 Geschätzt (für andere Manager):</span>
              <ul className="list-disc ml-4 mt-1">
                <li><span className="text-sky-700">Login-Bonus</span> = 100k × Tage seit erstem Transfer (~33 Mio/Saison)</li>
                <li><span className="text-violet-700">Achievements</span>: nur Spieltagssieger + Team-Punkte-Tiers — Einzelspieler/Hand/MVP fehlen</li>
              </ul>
            </div>
          </div>
          <div>
            <span className="font-medium text-foreground">Max-Gebot</span> nach 33 %-Regel:
            Verkauf an Liga-Bank gibt 67 % des MV.{" "}
            <span className="font-mono">Cash + 0,67 × MV teuerster Spieler</span> = realistischer Max-Bid.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Chart-Daten: Netto-Teamwert pro Spieltag ───────────────────── */
function buildTeamValueChartData(opts: {
  members: KbRankingUser[];
  transferLists: { user: KbRankingUser; transfers: import("@/lib/kickbase/types").KbManagerTransfer[] }[];
  bonusActivities: KbActivity[];
  initialBudget: number;
  /** Spieltag-Nummern parallel zu perMatchdayRankings */
  matchdaysToFetch: number[];
  perMatchdayRankings: KbRankingUser[][];
}): { data: TVChartPoint[]; managers: { id: string; name: string }[] } {
  if (opts.matchdaysToFetch.length < 2) return { data: [], managers: [] };

  // Chart zeigt vollen Saisonverlauf (kein Cap mehr — User sieht von MD 1
  // bis aktuell). Recharts handled X-Achse-Spacing automatisch.
  const days = opts.matchdaysToFetch.slice();
  const rankings = opts.perMatchdayRankings.slice();

  // matchday → latest bonus date (für Transfer-Cutoff)
  const matchdayEndDate = new Map<number, number>();
  for (const a of opts.bonusActivities) {
    if (a.t !== 22) continue;
    const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
    const day = data.day;
    if (typeof day !== "number") continue;
    const ts = parseFlexibleDateMs(a.dt);
    if (ts == null) continue;
    const existing = matchdayEndDate.get(day);
    if (!existing || ts > existing) matchdayEndDate.set(day, ts);
  }

  // transfers per user (sorted by ts)
  const userTransfers = new Map<
    string,
    { ts: number; tty: number; trp: number }[]
  >();
  for (const tl of opts.transferLists) {
    const sorted = tl.transfers
      .map((t) => ({ ts: new Date(t.dt).getTime(), tty: t.tty, trp: t.trp }))
      .filter((t) => !isNaN(t.ts))
      .sort((a, b) => a.ts - b.ts);
    userTransfers.set(tl.user.i, sorted);
  }

  // bonuses (with day attribution)
  const userBonuses = new Map<string, { day: number; bn: number }[]>();
  for (const a of opts.bonusActivities) {
    const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
    const bn = data.bn;
    const day = data.day;
    if (typeof day !== "number" || typeof bn !== "number") continue;
    if (!a.u?.i) continue;
    const arr = userBonuses.get(a.u.i) ?? [];
    arr.push({ day, bn });
    userBonuses.set(a.u.i, arr);
  }

  const currentMd = days[days.length - 1];

  // Punkteprämie 1k €/Spieltagspunkt — Kickbase-Doku, automatisch ausgezahlt
  // nach Abschluss eines Spieltags. Wir summieren mdp aus allen rankings bis
  // zum aktuellen MD und multiplizieren mit 1000. Das war der größte fehlende
  // Posten im Wettbewerb-Chart (bei stark-punktenden Managern ~30-40 Mio Diff).
  const EUR_PER_POINT = 1_000;

  const data: TVChartPoint[] = days.map((d, idx) => {
    const usersAtDay = rankings[idx] ?? [];
    const isCurrent = d === currentMd;
    // Cutoff-Strategie:
    //  - Wenn Bonus-Activity für diesen MD im Feed: nutze deren Timestamp.
    //  - Wenn nicht UND es ist der aktuelle MD: nutze Date.now() — alle bisher
    //    getätigten Transfers zählen (Spieltag läuft noch / Bonus nicht ausgezahlt).
    //  - Wenn nicht UND es ist ein alter MD: KEINE Transfers zählen (sonst
    //    werden alle Saison-Transfers fälschlich in den frühen MD gerechnet).
    const cutoffRaw = matchdayEndDate.get(d);
    const cutoff =
      cutoffRaw !== undefined
        ? cutoffRaw
        : isCurrent
        ? Date.now()
        : undefined;
    const point: TVChartPoint = { day: d };

    for (const u of usersAtDay) {
      const tv = typeof u.tv === "number" ? u.tv : 0;

      let cash = opts.initialBudget;
      // MD 1: HARDCODED — vor MD 1 gab es keine Transfers, keine Bonus-
      // Auszahlungen, keine Punkteprämien. Cash = initialBudget. Punkt.
      // (Vermeidet Bug wo cutoff zufällig auf späteres Datum zeigt und alle
      // Saison-Transfers fälschlich für MD 1 mitgezählt werden.)
      if (d > 1) {
        if (cutoff !== undefined) {
          const txs = userTransfers.get(u.i) ?? [];
          for (const t of txs) {
            if (t.ts > cutoff) break;
            if (t.tty === 1) cash -= t.trp;
            else if (t.tty === 2) cash += t.trp;
          }
        }
        const bs = userBonuses.get(u.i) ?? [];
        for (const b of bs) {
          if (b.day <= d) cash += b.bn;
        }

        // Punkteprämie: Σ aller mdp von MD 1 bis (d ggf. -1 wenn aktuell)
        const pointsCutoffIdx = isCurrent ? idx - 1 : idx;
        let pointsBonus = 0;
        for (let i = 0; i <= pointsCutoffIdx && i < rankings.length; i++) {
          const userAtMd = rankings[i]?.find((x) => x.i === u.i);
          const mdp = userAtMd?.mdp ?? 0;
          if (mdp > 0) pointsBonus += mdp * EUR_PER_POINT;
        }
        cash += pointsBonus;
      }

      point[u.n] = tv + cash;
    }
    return point;
  });

  return {
    data,
    managers: opts.members.map((m) => ({ id: m.i, name: m.n })),
  };
}

function parseFlexibleDateMs(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = new Date(v).getTime();
    return isNaN(t) ? null : t;
  }
  if (typeof v === "number") {
    return v < 1e11 ? v * 1000 : v;
  }
  return null;
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
        {/* Header row: avatar + name + Netto-Teamwert hero */}
        <div className="flex items-start gap-3 mb-4">
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
            <div className="text-xs text-muted-foreground tabular flex items-center gap-2 flex-wrap mt-0.5">
              {stats.placement !== undefined && <span>Platz #{stats.placement}</span>}
              {stats.seasonPoints !== undefined && (
                <span className="font-mono">{stats.seasonPoints.toLocaleString("de-DE")} Pkt</span>
              )}
              <span className="text-muted-foreground">·</span>
              <span>{stats.squadSize} Spieler</span>
            </div>
          </div>
          {/* Netto-Teamwert hero */}
          <div className="text-right shrink-0">
            <div
              className={cn(
                "text-xl sm:text-2xl font-bold tabular leading-none gradient-text"
              )}
            >
              {formatEUR(stats.netTeamValue, { compact: true })}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-1">
              Netto-Teamwert (gesch.)
            </div>
          </div>
        </div>

        {/* Stat grid — 2 zeilen × 3 spalten auf mobile, 6 spalten auf desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-sm">
          <Stat
            label="Teamwert"
            value={formatEUR(stats.teamValue, { compact: true })}
            icon={<Users className="size-3" />}
            sub="reine Spieler-Σ"
          />
          <Stat
            label="Kontostand"
            value={
              <span className={stats.cashEstimate < 0 ? "text-rose-600" : ""}>
                {formatEUR(stats.cashEstimate, { compact: true })}
              </span>
            }
            icon={<Wallet className="size-3" />}
            tone={stats.cashEstimate < 0 ? "danger" : undefined}
          />
          <Stat
            label="Max-Gebot"
            value={formatEUR(stats.maxBidSingleSell, { compact: true })}
            icon={<Target className="size-3" />}
            tone="primary"
            sub={`max ${formatEUR(stats.maxBidTotal, { compact: true })}`}
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
          <Stat
            label="Punkte"
            value={
              stats.seasonPoints !== undefined
                ? stats.seasonPoints.toLocaleString("de-DE")
                : "—"
            }
            icon={<Trophy className="size-3" />}
            sub={
              stats.placement !== undefined
                ? `Platz #${stats.placement}`
                : undefined
            }
          />
        </div>

        {/* Estimate-vs-Real Vergleich (nur eigener User) — Debug-Modus */}
        {stats.realCashFromApi !== undefined && (
          <CashDebugPanel stats={stats} budget={budget} />
        )}

        {/* Cash composition mini-bar */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 flex items-center gap-2 flex-wrap">
            Cash-Komposition (geschätzt)
            <span className="text-muted-foreground/70 normal-case tracking-normal">
              ({stats.daysActive} Tage · {stats.transferCount} Transfers)
            </span>
          </div>
          <div className="flex items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground tabular flex-wrap">
            <span>
              Start <span className="text-foreground font-mono">{formatEUR(budget, { compact: true })}</span>
            </span>
            <span className="text-rose-600">
              − {formatEUR(stats.totalBought, { compact: true })} Käufe
            </span>
            <span className="text-emerald-600">
              + {formatEUR(stats.totalSold, { compact: true })} Verkäufe
            </span>
            {stats.totalBonus > 0 && (
              <span className="text-amber-600">
                + {formatEUR(stats.totalBonus, { compact: true })} Boni
              </span>
            )}
            {stats.estimatedLoginBonus > 0 && (
              <span className="text-sky-600">
                + {formatEUR(stats.estimatedLoginBonus, { compact: true })} Login
              </span>
            )}
            {/* Erfolge: für eigenen User exakt verfügbar, sonst Spieltag+Hand-Schätzung */}
            {stats.realAchievementBonus !== undefined ? (
              <span className="text-violet-700 font-semibold">
                + {formatEUR(stats.realAchievementBonus, { compact: true })} Erfolge (exakt)
              </span>
            ) : (
              <>
                {stats.estimatedMatchdayBonus > 0 && (
                  <span className="text-violet-600">
                    + ~{formatEUR(stats.estimatedMatchdayBonus, { compact: true })} Spieltag
                  </span>
                )}
                {stats.estimatedHandBonus > 0 && (
                  <span className="text-fuchsia-600">
                    + {formatEUR(stats.estimatedHandBonus, { compact: true })} Hand
                  </span>
                )}
              </>
            )}
            {stats.cashUncertain && (
              <Badge variant="muted" className="text-[9px]">
                ungenau
              </Badge>
            )}
          </div>
          {/* Hand-Bonus-Breakdown — für alle Manager berechenbar */}
          {stats.handBonusBreakdown.length > 0 && !stats.realAchievementBonus && (
            <details className="mt-2 text-[10px]">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground tabular">
                Hand-Bonus-Trades ({stats.handBonusBreakdown.length})
              </summary>
              <div className="mt-1.5 grid sm:grid-cols-2 gap-x-3 gap-y-0.5 pl-2">
                {stats.handBonusBreakdown.slice(0, 12).map((h) => (
                  <div
                    key={h.pid}
                    className="flex items-center justify-between text-[10px] text-muted-foreground tabular"
                  >
                    <span className="truncate">
                      <span className="text-fuchsia-700 font-bold mr-1">{h.tier}</span>
                      {h.pn}
                      <span className="text-foreground/60 ml-1">
                        +{formatEUR(h.profit, { compact: true })}
                      </span>
                    </span>
                    <span className="font-mono text-fuchsia-700 font-semibold">
                      {formatEUR(h.payout, { compact: true })}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Achievement-Breakdown — nur für eigenen User */}
          {stats.achievementBreakdown && stats.achievementBreakdown.length > 0 && (
            <details className="mt-2 text-[10px]">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground tabular">
                Erfolge im Detail ({stats.achievementBreakdown.filter((a) => a.ac > 0).length} aktiv)
              </summary>
              <div className="mt-1.5 grid sm:grid-cols-2 gap-x-3 gap-y-0.5 pl-2">
                {stats.achievementBreakdown
                  .filter((a) => a.ac > 0 && a.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map((a) => (
                    <div
                      key={a.t}
                      className="flex items-center justify-between text-[10px] text-muted-foreground tabular"
                    >
                      <span className="truncate">
                        {a.n} <span className="text-foreground/60">×{a.ac}</span>
                      </span>
                      <span className="font-mono text-violet-700 font-semibold">
                        {formatEUR(a.total, { compact: true })}
                      </span>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Debug-Panel: detaillierter Cash-Compare ──────────────────── */
function CashDebugPanel({
  stats,
  budget,
}: {
  stats: ManagerComputedStats;
  budget: number;
}) {
  const real = stats.realCashFromApi ?? 0;
  const estimate = stats.cashEstimate;
  const diff = real - estimate;
  const absDiff = Math.abs(diff);

  // Achievement-Bonus-Komponente (entweder real oder geschätzt)
  const achievementSum =
    stats.realAchievementBonus !== undefined
      ? stats.realAchievementBonus
      : stats.estimatedMatchdayBonus + stats.estimatedHandBonus;

  // Show line-by-line breakdown
  const lines: Array<{
    label: string;
    value: number;
    note?: string;
    color?: string;
    sign?: "+" | "−";
  }> = [
    { label: "Initial-Budget", value: budget, sign: "+" },
    { label: `Käufe (${stats.transferCount > 0 ? "alle" : "0"})`, value: -stats.totalBought, sign: "−", color: "text-rose-700" },
    { label: "Verkäufe", value: stats.totalSold, sign: "+", color: "text-emerald-700" },
    {
      label:
        stats.realAchievementBonus !== undefined
          ? "Bonus-Feed (data.bn) — übersprungen (= redundant zu achievements/points/login)"
          : "Bonus-Feed (data.bn)",
      value: stats.realAchievementBonus !== undefined ? 0 : stats.totalBonus,
      sign: "+",
      color:
        stats.realAchievementBonus !== undefined
          ? "text-muted-foreground line-through"
          : "text-amber-700",
      note:
        stats.realAchievementBonus !== undefined
          ? `${stats.bonusEventCount} events ignoriert`
          : `${stats.bonusEventCount} events`,
    },
    {
      label: "Punkteprämie (abgeschlossen)",
      value: stats.estimatedPointsBonus,
      sign: "+",
      color: "text-emerald-700",
      note: `${stats.totalMatchdayPoints.toLocaleString("de-DE")} Pkt × 1k €`,
    },
    { label: `Login-Bonus (geschätzt)`, value: stats.estimatedLoginBonus, sign: "+", color: "text-sky-700", note: `${stats.daysActive} Tage × 100k` },
    {
      label:
        stats.realAchievementBonus !== undefined
          ? "Erfolge (echt aus /user/achievements)"
          : "Spieltag + Hand (geschätzt)",
      value: achievementSum,
      sign: "+",
      color: "text-violet-700",
    },
  ];

  return (
    <div
      className={cn(
        "mt-4 rounded-lg border p-3",
        absDiff < 1_000_000
          ? "border-emerald-300 bg-emerald-50/40"
          : absDiff < 5_000_000
          ? "border-amber-300 bg-amber-50/40"
          : "border-rose-300 bg-rose-50/40"
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-2">
        📊 Cash-Pipeline-Debug
        <Badge variant={absDiff < 1_000_000 ? "success" : absDiff < 5_000_000 ? "muted" : "danger"} className="text-[9px]">
          {absDiff < 1_000_000 ? "✓ Genau" : absDiff < 5_000_000 ? "Akzeptabel" : "Pipeline-Fehler!"}
        </Badge>
      </div>

      {/* Compact 3-card top */}
      <div className="grid grid-cols-3 gap-2 text-xs tabular mb-3">
        <div className="bg-white/70 rounded p-2 ring-1 ring-border">
          <div className="text-[10px] text-muted-foreground">Geschätzt</div>
          <div className="font-mono font-bold text-base">
            {formatEUR(estimate, { compact: true })}
          </div>
        </div>
        <div className="bg-white/70 rounded p-2 ring-1 ring-emerald-200">
          <div className="text-[10px] text-muted-foreground">Echt (Kickbase)</div>
          <div className="font-mono font-bold text-base text-emerald-700">
            {formatEUR(real, { compact: true })}
          </div>
        </div>
        <div
          className={cn(
            "rounded p-2 ring-1",
            diff > 0 ? "bg-rose-100/60 ring-rose-300" : "bg-emerald-100/60 ring-emerald-300"
          )}
        >
          <div className="text-[10px] text-muted-foreground">
            {diff > 0 ? "Wir schätzen ZU NIEDRIG" : "Wir schätzen ZU HOCH"}
          </div>
          <div
            className={cn(
              "font-mono font-bold text-base",
              diff > 0 ? "text-rose-700" : "text-emerald-700"
            )}
          >
            {diff > 0 ? "+" : ""}
            {formatEUR(diff, { compact: true })}
          </div>
        </div>
      </div>

      {/* Pipeline-Lines */}
      <div className="text-[11px] tabular space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Schritt-für-Schritt
        </div>
        {lines.map((l, i) => (
          <div key={i} className="flex items-center justify-between border-b border-border/30 pb-0.5">
            <span className="flex items-center gap-1.5">
              <span className={cn("font-mono w-3", l.color)}>{l.sign}</span>
              <span>{l.label}</span>
              {l.note && (
                <span className="text-[10px] text-muted-foreground">({l.note})</span>
              )}
            </span>
            <span className={cn("font-mono font-medium", l.color)}>
              {formatEUR(Math.abs(l.value), { compact: true })}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-border">
          <span className="font-semibold">= Schätzung</span>
          <span className="font-mono font-bold">
            {formatEUR(estimate, { compact: true })}
          </span>
        </div>
        <div className="flex items-center justify-between text-rose-700">
          <span className="font-semibold">Was uns fehlt</span>
          <span className="font-mono font-bold">
            {diff > 0 ? "+" : ""}
            {formatEUR(diff, { compact: true })}
          </span>
        </div>
        {stats.openMatchdayPoints > 0 && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 italic">
            <span>
              ⏳ Laufender Spieltag: {stats.openMatchdayPoints.toLocaleString("de-DE")} Pkt
              (= {formatEUR(stats.openMatchdayBonus, { compact: true })}) — von Kickbase
              noch nicht ausgezahlt, daher NICHT in der Schätzung
            </span>
          </div>
        )}
      </div>

      {/* Hypothesen-Rechner: Was MÜSSTEN die Werte sein um real zu treffen? */}
      {Math.abs(diff) > 1_000_000 && (
        <div className="mt-3 pt-3 border-t border-rose-200">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
            🔍 Hypothesen-Rechner — Was schließt die {formatEUR(diff, { compact: true })}-Lücke?
          </div>
          <div className="grid sm:grid-cols-3 gap-2 text-[11px] tabular">
            <HypothesisCard
              title="A: Initial-Budget"
              currentValue={budget}
              targetValue={budget + diff}
              unit="€"
              hint="wenn bs > 1 oder Premium-Liga"
            />
            <HypothesisCard
              title="B: Login pro Tag"
              currentValue={100_000}
              targetValue={100_000 + diff / Math.max(stats.daysActive, 1)}
              unit="€/Tag"
              hint={`bei ${stats.daysActive} Tagen`}
            />
            <HypothesisCard
              title="C: Achievements"
              currentValue={
                stats.realAchievementBonus !== undefined
                  ? stats.realAchievementBonus
                  : stats.estimatedMatchdayBonus + stats.estimatedHandBonus
              }
              targetValue={
                (stats.realAchievementBonus !== undefined
                  ? stats.realAchievementBonus
                  : stats.estimatedMatchdayBonus + stats.estimatedHandBonus) + diff
              }
              unit="€"
              hint="falls API er-Werte zu niedrig liefert"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            ☝️ Welche der drei Werte stimmt mit deinen Erwartungen am ehesten überein?
            Das ist die wahrscheinliche Ursache.
          </p>
        </div>
      )}

      {/* Achievement-Detail wenn vorhanden */}
      {stats.achievementBreakdown && stats.achievementBreakdown.length > 0 && (
        <details className="mt-3 text-[11px]" open={absDiff >= 5_000_000}>
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
            Achievement-Komponente — alle {stats.achievementBreakdown.length} Typen aus
            /user/achievements (auch er=0)
          </summary>
          <div className="mt-2 grid sm:grid-cols-2 gap-x-3 gap-y-0.5 pl-2 max-h-72 overflow-auto">
            {stats.achievementBreakdown
              .slice()
              .sort((a, b) => b.total - a.total)
              .map((a) => (
                <div
                  key={a.t}
                  className={cn(
                    "flex items-center justify-between text-[10px] tabular py-0.5",
                    a.ac > 0 && a.er === 0
                      ? "text-rose-700 font-semibold"
                      : a.ac === 0
                      ? "text-muted-foreground/50"
                      : "text-muted-foreground"
                  )}
                >
                  <span className="truncate">
                    <span className="text-foreground/70 font-mono mr-1">[t={a.t}]</span>
                    {a.n} <span className="text-foreground/60">×{a.ac}</span>
                    {a.ac > 0 && a.er === 0 && (
                      <span className="text-rose-600 ml-1">⚠ er=0!</span>
                    )}
                  </span>
                  <span className="font-mono">
                    {a.er > 0 ? formatEUR(a.er, { compact: true }) : "—"} ×{a.ac} ={" "}
                    {formatEUR(a.total, { compact: true })}
                  </span>
                </div>
              ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            🚨 Zeilen mit{" "}
            <span className="text-rose-700 font-semibold">⚠ er=0!</span> haben{" "}
            <code className="font-mono">ac &gt; 0</code> aber wir kennen den Belohnungsbetrag
            nicht — das sind Kandidaten für die fehlenden Mio.
          </p>
        </details>
      )}

      <p className="text-[10px] text-muted-foreground mt-3 italic">
        Pipeline läuft IDENTISCH für alle Manager. Diff hier = Schätzfehler den auch andere
        Cards systemisch haben. Erst wenn diese Diff &lt; 1 Mio sind die anderen Werte
        glaubwürdig.
      </p>
    </div>
  );
}

function HypothesisCard({
  title,
  currentValue,
  targetValue,
  unit,
  hint,
}: {
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  hint: string;
}) {
  const fmt = (v: number) => {
    if (unit === "€") return formatEUR(v, { compact: true });
    if (unit === "€/Tag") return `${Math.round(v / 1000)}k €/Tag`;
    return String(v);
  };
  return (
    <div className="rounded-md bg-white/70 ring-1 ring-border p-2">
      <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">
        {title}
      </div>
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-muted-foreground line-through text-[10px]">
          {fmt(currentValue)}
        </span>
        <span className="text-base font-mono font-bold text-rose-700">
          {fmt(targetValue)}
        </span>
      </div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{hint}</div>
    </div>
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

/**
 * Große tabellarische Übersicht aller Manager mit allen wichtigen Stats
 * nebeneinander. Eigener User wird hervorgehoben.
 */
function CompareTable({
  stats,
  myUserId,
}: {
  stats: ManagerComputedStats[];
  myUserId: string;
}) {
  return (
    <Card className="overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left pl-4 py-2.5 font-semibold w-10">#</th>
              <th className="text-left py-2.5 font-semibold min-w-[140px]">
                Manager
              </th>
              <th className="text-right py-2.5 font-semibold">Punkte</th>
              <th className="text-right py-2.5 font-semibold">Spieltag</th>
              <th className="text-right py-2.5 font-semibold">Teamwert</th>
              <th className="text-right py-2.5 font-semibold">Cash</th>
              <th className="text-right py-2.5 font-semibold bg-primary/[0.04]">
                Netto-TW
              </th>
              <th className="text-right py-2.5 font-semibold">Max-Gebot</th>
              <th className="text-right py-2.5 font-semibold">Δ Transfer</th>
              <th className="text-right pr-4 py-2.5 font-semibold">24 h</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => {
              const isMe = s.userId === myUserId;
              return (
                <tr
                  key={s.userId}
                  className={cn(
                    "border-b border-border/40 last:border-0",
                    isMe && "bg-primary/[0.06] font-medium"
                  )}
                >
                  <td className="pl-4 py-2.5 text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar name={s.name} image={s.image} size="xs" />
                      <span className={cn("truncate", isMe && "font-semibold")}>
                        {s.name}
                      </span>
                      {isMe && (
                        <span className="inline-flex items-center px-1 py-0 rounded text-[9px] font-bold bg-primary text-primary-foreground">
                          Du
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right py-2.5 font-mono font-semibold">
                    {s.seasonPoints?.toLocaleString("de-DE") ?? "—"}
                  </td>
                  <td className="text-right py-2.5 font-mono text-emerald-700">
                    {s.estimatedMatchdayBonus
                      ? `+${(s.estimatedMatchdayBonus / 1_000_000).toFixed(1).replace(".", ",")}M`
                      : "—"}
                  </td>
                  <td className="text-right py-2.5 font-mono">
                    {formatEUR(s.teamValue, { compact: true })}
                  </td>
                  <td
                    className={cn(
                      "text-right py-2.5 font-mono",
                      s.cashEstimate < 0 ? "text-rose-600" : "text-foreground"
                    )}
                  >
                    {formatEUR(s.cashEstimate, { compact: true })}
                  </td>
                  <td className="text-right py-2.5 font-mono font-semibold bg-primary/[0.04]">
                    {formatEUR(s.netTeamValue, { compact: true })}
                  </td>
                  <td className="text-right py-2.5 font-mono text-muted-foreground">
                    {formatEUR(s.maxBidSingleSell, { compact: true })}
                  </td>
                  <td
                    className={cn(
                      "text-right py-2.5 font-mono",
                      s.transferBalance > 0
                        ? "text-emerald-600"
                        : s.transferBalance < 0
                        ? "text-rose-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {s.transferBalance === 0
                      ? "—"
                      : (s.transferBalance > 0 ? "+" : "") +
                        formatEUR(s.transferBalance, { compact: true })}
                  </td>
                  <td
                    className={cn(
                      "text-right pr-4 py-2.5 font-mono",
                      s.dayGain > 0
                        ? "text-emerald-600"
                        : s.dayGain < 0
                        ? "text-rose-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {s.dayGain === 0
                      ? "—"
                      : (s.dayGain > 0 ? "+" : "") +
                        formatEUR(s.dayGain, { compact: true })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground px-4 py-2 border-t border-border bg-muted/30">
        Sortierung folgt deiner Tab-Auswahl oben · Netto-TW = Teamwert + Cash
        (Gesamt-Vermögen) · Max-Gebot = Cash + 67 % vom teuersten Squad-Spieler
      </p>
    </Card>
  );
}
