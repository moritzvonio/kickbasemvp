import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { TeamTag } from "@/components/ui/team-tag";
import { FormDots } from "@/components/ui/form-dots";
import { formatEUR, formatDelta, cn } from "@/lib/utils";
import { marketEntryPid, type KbRankingUser } from "@/lib/kickbase/types";
import { PointsBarChart, type PointsBarChartPoint } from "./PointsBarChart";
import { TeamValueSpark, type TVSparkPoint } from "./TeamValueSpark";
import {
  Trophy,
  Wallet,
  TrendingUp,
  Users,
  Crown,
  Activity,
  Calendar,
  Flame,
  ArrowRightLeft,
  Award,
  BarChart3,
  Clock,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

type SortKey = "points" | "tv";

export default async function LeagueDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { id: leagueId } = await params;
  const sp = await searchParams;
  const sortKey: SortKey = sp.sort === "tv" ? "tv" : "points";
  const path = `/league/${leagueId}`;
  const session = await requireSessionOrRedirect(path);

  const emptyRanking = {} as Awaited<ReturnType<typeof kb.ranking>>;
  const emptySquad = { it: [] } as Awaited<ReturnType<typeof kb.squad>>;
  const emptyActivities = { af: [] } as Awaited<ReturnType<typeof kb.activities>>;
  const emptyMarket = { it: [] } as Awaited<ReturnType<typeof kb.market>>;

  const [budget, squad, ranking, activities, market] = await Promise.all([
    withKbAuth(path, () => kb.myBudget(session.token, leagueId)).catch(() => null),
    withKbAuth(path, () => kb.squad(session.token, leagueId)).catch(() => emptySquad),
    withKbAuth(path, () => kb.ranking(session.token, leagueId)).catch(() => emptyRanking),
    withKbAuth(path, () => kb.activities(session.token, leagueId, { max: 12 })).catch(() => emptyActivities),
    withKbAuth(path, () => kb.market(session.token, leagueId)).catch(() => emptyMarket),
  ]);

  const players = squad.it ?? [];
  const members = (ranking.us ?? ranking.it ?? [])
    .slice()
    .sort((a, b) => (a.spl ?? 99) - (b.spl ?? 99));
  const meRanking = members.find((m) => m.i === session.userId);
  const leagueName = ranking.ti ?? budget?.lnm ?? "Liga";
  const seasonName = ranking.sn;
  const matchday = ranking.day;
  const totalMatchdays = ranking.nd;

  const myTeamValue = meRanking?.tv ?? players.reduce((s, p) => s + (p.mv ?? 0), 0);
  const myCash = budget?.b ?? 0;
  const myNetTeamValue = myTeamValue + myCash;

  // Per-Matchday Rankings für Bar-Chart, TW-Sparkline und Form-Dots aller Manager
  const matchdaysToFetch: number[] = [];
  if (matchday !== undefined && matchday >= 1) {
    for (let d = 1; d <= matchday; d++) matchdaysToFetch.push(d);
  }
  const perMatchdayRankings = await Promise.all(
    matchdaysToFetch.map((d) =>
      withKbAuth(path, () => kb.ranking(session.token, leagueId, d))
        .then((r) => r.us ?? r.it ?? [])
        .catch(() => [] as KbRankingUser[])
    )
  );

  // Punkte-Bar-Chart-Daten (Spieltagspunkte des eigenen Users)
  const pointsBars: PointsBarChartPoint[] = perMatchdayRankings.map((md, idx) => {
    const day = matchdaysToFetch[idx];
    const me = md.find((u) => u.i === session.userId);
    const liga =
      md.length > 0 ? md.reduce((s, u) => s + (u.mdp ?? 0), 0) / md.length : 0;
    return { day, points: me?.mdp ?? 0, ligaAvg: liga };
  });
  const totalLigaAvg =
    pointsBars.length > 0
      ? pointsBars.reduce((s, p) => s + (p.ligaAvg ?? 0), 0) / pointsBars.length
      : 0;
  const totalPlayedDays = pointsBars.filter((p) => p.points > 0).length;
  const myAvgPerDay =
    totalPlayedDays > 0
      ? pointsBars.reduce((s, p) => s + p.points, 0) / totalPlayedDays
      : 0;
  const bestDay = pointsBars.reduce(
    (best, p) => (p.points > (best?.points ?? 0) ? p : best),
    pointsBars[0]
  );

  // Form-Dots & Spieltagspunkte je Manager – aus perMatchdayRankings ableiten
  const last5ByManager = new Map<string, number[]>();
  const recent = perMatchdayRankings.slice(-5);
  for (const m of members) {
    const arr: number[] = [];
    for (const md of recent) {
      const entry = md.find((u) => u.i === m.i);
      arr.push(entry?.mdp ?? 0);
    }
    last5ByManager.set(m.i, arr);
  }

  // Markt-Snapshot
  const marketItems = market.it ?? [];
  const expiringSoon = marketItems
    .filter((m) => typeof m.exs === "number" && m.exs > 0)
    .slice()
    .sort((a, b) => (a.exs ?? 0) - (b.exs ?? 0))
    .slice(0, 10);

  // Member-Lookup für Aktivitäten-User-Auflösung (Avatar + Name)
  const memberById = new Map(members.map((m) => [m.i, m]));


  // Sortierte Tabelle für die kompakte oben
  const sortedMembers = members.slice().sort((a, b) => {
    if (sortKey === "tv") return (b.tv ?? 0) - (a.tv ?? 0);
    return (b.sp ?? 0) - (a.sp ?? 0);
  });

  // Snapshot-Window: 7 Manager um die eigene Position. Wenn man oben/unten
  // ist, schiebt sich das Fenster sodass weiterhin 7 Zeilen erscheinen.
  const SNAPSHOT_SIZE = 7;
  const myIdx = sortedMembers.findIndex((m) => m.i === session.userId);
  let startIdx: number;
  let endIdx: number;
  if (myIdx < 0 || sortedMembers.length <= SNAPSHOT_SIZE) {
    startIdx = 0;
    endIdx = sortedMembers.length;
  } else {
    const half = Math.floor(SNAPSHOT_SIZE / 2); // 3
    startIdx = Math.max(0, myIdx - half);
    endIdx = Math.min(sortedMembers.length, startIdx + SNAPSHOT_SIZE);
    // Wenn endIdx geclampt wurde, startIdx nachziehen damit wir 7 zeigen
    startIdx = Math.max(0, endIdx - SNAPSHOT_SIZE);
  }
  const snapshotMembers = sortedMembers.slice(startIdx, endIdx);
  const hasMoreAbove = startIdx > 0;
  const hasMoreBelow = endIdx < sortedMembers.length;

  // Daten für Teamwert-Chart (eigener User pro Spieltag)
  const tvSparkData: TVSparkPoint[] = perMatchdayRankings
    .map((md, idx) => {
      const me = md.find((u) => u.i === session.userId);
      const tv = me?.tv;
      if (typeof tv !== "number" || tv <= 0) return null;
      return { day: matchdaysToFetch[idx], tv };
    })
    .filter((p): p is TVSparkPoint => p !== null);
  const tvFirst = tvSparkData[0]?.tv ?? myTeamValue;
  const tvDelta = myTeamValue - tvFirst;

  // Compare-Daten für andere Manager (für Dropdown im Chart)
  const compareManagers = members
    .filter((m) => m.i !== session.userId)
    .map((m) => ({
      id: m.i,
      name: m.n,
      data: perMatchdayRankings
        .map((md, idx) => {
          const entry = md.find((u) => u.i === m.i);
          const tv = entry?.tv;
          if (typeof tv !== "number" || tv <= 0) return null;
          return { day: matchdaysToFetch[idx], tv };
        })
        .filter((p): p is TVSparkPoint => p !== null),
    }))
    .filter((m) => m.data.length >= 2)
    // Sortieren nach aktuellem Teamwert (höchster zuerst)
    .sort((a, b) => {
      const aLast = a.data[a.data.length - 1]?.tv ?? 0;
      const bLast = b.data[b.data.length - 1]?.tv ?? 0;
      return bLast - aLast;
    });

  return (
    <div className="space-y-6">
      {/* League header */}
      <section className="slide-up">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Trophy className="size-5" />
              </span>
              {leagueName}
            </h1>
            <div className="text-sm text-muted-foreground mt-2 flex items-center gap-3 flex-wrap">
              {seasonName && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Saison {seasonName}
                </span>
              )}
              {matchday !== undefined && (
                <span className="inline-flex items-center gap-1.5">
                  <Flame className="size-3.5 text-amber-500" />
                  Spieltag {matchday}
                  {totalMatchdays && ` / ${totalMatchdays}`}
                </span>
              )}
              {members.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {members.length} Manager
                </span>
              )}
            </div>
          </div>
          {meRanking && meRanking.spl === 1 && (
            <Badge variant="success" className="gap-1.5 py-1 px-3">
              <Crown className="size-3.5" /> Tabellenführer
            </Badge>
          )}
        </div>
      </section>

      {/* Top KPIs – kompakter */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 slide-up slide-up-1">
        <MiniKpi
          icon={<Trophy className="size-3.5" />}
          label="Platz"
          value={meRanking?.spl !== undefined ? `#${meRanking.spl}` : "–"}
          sub={members.length ? `von ${members.length}` : undefined}
        />
        <MiniKpi
          icon={<TrendingUp className="size-3.5" />}
          label="Saison-Punkte"
          value={
            meRanking?.sp !== undefined
              ? meRanking.sp.toLocaleString("de-DE")
              : "–"
          }
          sub={
            myAvgPerDay > 0
              ? `Ø ${Math.round(myAvgPerDay)} / Spieltag`
              : undefined
          }
        />
        <MiniKpi
          icon={<Users className="size-3.5" />}
          label="Netto-Teamwert"
          value={formatEUR(myTeamValue, { compact: true })}
          sub="reine Spielerwerte"
        />
        <MiniKpi
          icon={<TrendingUp className="size-3.5" />}
          label="Brutto-Teamwert"
          value={formatEUR(myNetTeamValue, { compact: true })}
          sub="inkl. Cash"
        />
        <MiniKpi
          icon={<Wallet className="size-3.5" />}
          label="Cash"
          value={formatEUR(myCash, { compact: true })}
        />
      </section>

      {/* Tabelle-Snapshot (7 Manager um meine Position) + Teamwert-Chart */}
      <section className="grid gap-4 lg:grid-cols-2 slide-up slide-up-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" />
              Liga-Snapshot
              <div className="ml-auto flex gap-1">
                <SortPill
                  href="?sort=points"
                  label="Punkte"
                  active={sortKey === "points"}
                />
                <SortPill href="?sort=tv" label="Teamwert" active={sortKey === "tv"} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {snapshotMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground px-5 pb-3">
                Tabelle nicht verfügbar.
              </p>
            ) : (
              <div className="overflow-x-auto">
                {hasMoreAbove && (
                  <div className="px-5 pb-1.5 text-[10px] text-muted-foreground tabular">
                    ↑ {startIdx} weitere oben
                  </div>
                )}
                <table className="tbl">
                  <thead>
                    <tr>
                      <th className="text-left w-12 pl-5">#</th>
                      <th className="text-left">Manager</th>
                      <th className="text-right">Punkte</th>
                      <th className="text-right pr-5">Teamwert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshotMembers.map((m, i) => {
                      const isMe = m.i === session.userId;
                      const absRank = startIdx + i + 1;
                      return (
                        <tr key={m.i} className={isMe ? "bg-primary/[0.06]" : ""}>
                          <td className="pl-5">
                            {sortKey === "points"
                              ? placementBadge(m.spl)
                              : placementBadge(absRank)}
                          </td>
                          <td>
                            <div className="flex items-center gap-2 min-w-0">
                              <UserAvatar name={m.n} image={m.uim} size="sm" />
                              <span
                                className={cn(
                                  "truncate",
                                  isMe && "font-semibold"
                                )}
                              >
                                {m.n}
                              </span>
                              {isMe && (
                                <Badge
                                  variant="default"
                                  className="text-[10px] py-0"
                                >
                                  Du
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-right font-mono font-semibold">
                            {m.sp?.toLocaleString("de-DE") ?? "–"}
                          </td>
                          <td className="text-right font-mono text-muted-foreground pr-5">
                            {m.tv ? formatEUR(m.tv, { compact: true }) : "–"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {hasMoreBelow && (
                  <div className="px-5 pt-1.5 text-[10px] text-muted-foreground tabular">
                    ↓ {sortedMembers.length - endIdx} weitere unten
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover overflow-hidden relative flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300" />
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4 text-emerald-600" />
              Teamwert seit Saisonstart
              <span className="ml-auto text-xs font-normal flex items-baseline gap-1.5">
                <span className="font-bold tabular text-foreground">
                  {formatEUR(myTeamValue, { compact: true })}
                </span>
                {tvSparkData.length >= 2 && (
                  <span
                    className={cn(
                      "font-mono tabular font-semibold",
                      tvDelta >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {tvDelta >= 0 ? "+" : ""}
                    {formatEUR(tvDelta, { compact: true })}
                  </span>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1 pt-0 pb-3 flex-1 flex flex-col min-h-0">
            <TeamValueSpark
              data={tvSparkData}
              selfName={meRanking?.n ?? "Du"}
              managers={compareManagers}
            />
          </CardContent>
        </Card>
      </section>

      {/* Bald auslaufende Spieler + Liga-Aktivitäten */}
      <section className="grid gap-4 lg:grid-cols-2 slide-up slide-up-3">
        <Card className="card-hover overflow-hidden relative flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-300" />
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-amber-600" />
              Bald auslaufende Spieler
              <Link
                href={`/league/${leagueId}/markt?sort=expiry`}
                className="ml-auto text-[10px] text-primary hover:underline font-normal"
              >
                Markt →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 flex-1 overflow-y-auto">
            {expiringSoon.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aktuell keine ablaufenden Angebote.
              </p>
            ) : (
              expiringSoon.map((m) => {
                const pid = marketEntryPid(m);
                return (
                  <Link
                    key={pid}
                    href={`/league/${leagueId}/spieler/${pid}`}
                    className="flex items-center gap-2.5 px-2 py-1.5 -mx-2 rounded-lg hover:bg-accent/60 transition-colors"
                  >
                    <PlayerAvatar pim={m.pim} tid={m.tid} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{m.n}</div>
                      <div className="text-[10px] text-muted-foreground tabular flex items-center gap-1.5">
                        <TeamTag tid={m.tid} size="xs" />
                        <span>{formatEUR(m.prc, { compact: true })}</span>
                      </div>
                    </div>
                    <span className="text-[10px] tabular shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 ring-1 ring-amber-200 font-semibold">
                      <Clock className="size-3" />
                      {formatExpiry(m.exs ?? 0)}
                    </span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Liga-Aktivität
              <Link
                href={`/league/${leagueId}/feed`}
                className="ml-auto text-[10px] text-primary hover:underline font-normal"
              >
                Alle →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 flex-1 overflow-y-auto">
            {(() => {
              const list = activities.af ?? activities.it ?? [];
              if (list.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground">
                    Keine Aktivitäten gefunden.
                  </p>
                );
              }
              return list
                .slice(0, 10)
                .map((a) => (
                  <ActivityRow
                    key={a.i}
                    activity={a}
                    memberById={memberById}
                  />
                ));
            })()}
          </CardContent>
        </Card>
      </section>

      {/* 34 Spieltage Bar-Chart (Vollbreite) */}
      {pointsBars.length > 0 && (
        <Card className="slide-up slide-up-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Punkte pro Spieltag
              <span className="ml-auto text-[11px] text-muted-foreground tabular font-normal">
                Ø {Math.round(myAvgPerDay)} Pkt
                {totalLigaAvg > 0 && (
                  <>
                    {" · "}Liga-Ø {Math.round(totalLigaAvg)}
                  </>
                )}
                {bestDay && bestDay.points > 0 && (
                  <>
                    {" · "}Top: MD {bestDay.day} ({bestDay.points})
                  </>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PointsBarChart data={pointsBars} ligaAvg={totalLigaAvg} />
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Skala: &lt; 500 = tiefrot · 1000 = grün · &gt; 1300 = max grün
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ausführliche Tabelle – mit Form-Dots, MV-Trend, Squad-Größe */}
      <Card className="slide-up slide-up-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-4 text-primary" />
            Tabelle ausführlich
            {matchday !== undefined && (
              <Badge variant="muted" className="ml-auto text-[10px]">
                Spieltag {matchday}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground px-5 pb-3">
              Tabelle nicht verfügbar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="text-left w-12 pl-5">#</th>
                    <th className="text-left">Manager</th>
                    <th className="text-right">Punkte</th>
                    <th className="text-right hidden sm:table-cell">Spieltag</th>
                    <th className="text-left hidden md:table-cell">Form (5)</th>
                    <th className="text-right hidden md:table-cell">Teamwert</th>
                    <th className="text-right pr-5">MV-Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const isMe = m.i === session.userId;
                    const last5 = last5ByManager.get(m.i) ?? [];
                    // MV-Trend: erste vs. letzte tv aus perMatchdayRankings
                    const tvFirst =
                      perMatchdayRankings[0]?.find((u) => u.i === m.i)?.tv ?? 0;
                    const tvNow = m.tv ?? 0;
                    const tvDelta = tvFirst > 0 ? tvNow - tvFirst : 0;
                    return (
                      <tr key={m.i} className={isMe ? "bg-primary/[0.06]" : ""}>
                        <td className="pl-5">{placementBadge(m.spl)}</td>
                        <td>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar name={m.n} image={m.uim} size="sm" />
                            <div className="min-w-0 flex items-center gap-2">
                              <span
                                className={
                                  "truncate " + (isMe ? "font-semibold" : "")
                                }
                              >
                                {m.n}
                              </span>
                              {isMe && (
                                <Badge
                                  variant="default"
                                  className="text-[10px] py-0"
                                >
                                  Du
                                </Badge>
                              )}
                              {m.adm && (
                                <Badge
                                  variant="muted"
                                  className="text-[10px] py-0"
                                >
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-right font-mono font-semibold">
                          {m.sp?.toLocaleString("de-DE") ?? "–"}
                        </td>
                        <td className="text-right font-mono text-emerald-700 hidden sm:table-cell">
                          {m.mdp !== undefined
                            ? `+${m.mdp.toLocaleString("de-DE")}`
                            : "–"}
                        </td>
                        <td className="hidden md:table-cell">
                          {last5.length > 0 ? (
                            <FormDots points={last5} />
                          ) : (
                            <span className="text-xs text-muted-foreground">–</span>
                          )}
                        </td>
                        <td className="text-right font-mono text-muted-foreground hidden md:table-cell">
                          {m.tv ? formatEUR(m.tv, { compact: true }) : "–"}
                        </td>
                        <td className="text-right pr-5 font-mono tabular">
                          {tvDelta !== 0 ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 text-xs",
                                tvDelta > 0
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              )}
                            >
                              {tvDelta > 0 ? (
                                <ArrowUp className="size-3" />
                              ) : (
                                <ArrowDown className="size-3" />
                              )}
                              {formatDelta(tvDelta)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">–</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniKpi({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="card-hover">
      <CardContent className="p-2.5">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1 mb-0.5">
          {icon}
          {label}
        </div>
        <div className="text-base font-bold tabular truncate leading-tight">
          {value}
        </div>
        {sub && (
          <div className="text-[10px] text-muted-foreground truncate leading-tight">
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SortPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

function placementBadge(pl?: number) {
  if (pl === undefined) return <span className="text-muted-foreground">–</span>;
  if (pl === 1)
    return (
      <span className="inline-flex items-center justify-center size-7 rounded-lg bg-amber-100 text-base ring-1 ring-amber-200">
        🥇
      </span>
    );
  if (pl === 2)
    return (
      <span className="inline-flex items-center justify-center size-7 rounded-lg bg-slate-100 text-base ring-1 ring-slate-200">
        🥈
      </span>
    );
  if (pl === 3)
    return (
      <span className="inline-flex items-center justify-center size-7 rounded-lg bg-orange-100 text-base ring-1 ring-orange-200">
        🥉
      </span>
    );
  return <span className="font-mono text-sm text-muted-foreground">{pl}</span>;
}

function formatExpiry(seconds: number): string {
  if (seconds <= 0) return "abgelaufen";
  const hours = Math.floor(seconds / 3600);
  if (hours < 1) return `${Math.floor(seconds / 60)}m`;
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function ActivityRow({
  activity,
  memberById,
}: {
  activity: import("@/lib/kickbase/types").KbActivity;
  memberById: Map<string, import("@/lib/kickbase/types").KbRankingUser>;
}) {
  const icon = activityIcon(activity.t);
  const data = (activity.data ?? activity.d ?? {}) as Record<string, unknown>;

  // User-Auflösung: bevorzugt activity.u, fallback Lookup über members per ID.
  // Wenn kein User vorhanden → System-Event über einen Spieler (z.B. MV-Änderung).
  const userId = activity.u?.i;
  const fallback = userId ? memberById.get(userId) : undefined;
  const userName = activity.u?.n || fallback?.n;
  const userImage = activity.u?.uim || fallback?.uim;
  const hasUser = !!userName;

  // Spieler-Daten als Fallback-Avatar / -Name
  const ln = data.ln as string | undefined;
  const fn = data.fn as string | undefined;
  const pi = data.pi as string | undefined;
  const tid = data.tid as string | undefined;
  const pim = data.pim as string | undefined;
  const playerName =
    (data.pn as string) ??
    (data.player as string) ??
    (data.name as string) ??
    (ln ? (fn ? `${fn[0]}. ${ln}` : ln) : undefined);
  const hasPlayer = !!(playerName || pim || pi);

  return (
    <div className="text-sm border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
      <div className="flex items-start gap-2.5">
        {hasUser ? (
          <UserAvatar name={userName!} image={userImage} size="xs" />
        ) : hasPlayer ? (
          <PlayerAvatar pim={pim} tid={tid} size={28} />
        ) : (
          <span className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/20">
            {icon ?? <Activity className="size-3" />}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            {hasUser ? (
              <>
                <span className="font-semibold">{userName}</span>{" "}
                <span className="text-muted-foreground">
                  {describeActivity(activity)}
                </span>
              </>
            ) : hasPlayer && playerName ? (
              <>
                <span className="font-semibold">{playerName}</span>{" "}
                <span className="text-muted-foreground">
                  {describeSystemActivity(activity)}
                </span>
              </>
            ) : (
              <span className="font-medium">{describeActivity(activity)}</span>
            )}
          </div>
          {hasPlayer && tid && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              <TeamTag tid={tid} size="xs" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {icon && (
            <span className="size-5 rounded bg-muted text-muted-foreground inline-flex items-center justify-center">
              {icon}
            </span>
          )}
          {activity.dt !== undefined && (
            <span className="text-xs text-muted-foreground whitespace-nowrap tabular">
              {formatActivityDate(activity.dt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Aktivitäten ohne User-Bezug – Liga-System-Events */
function describeSystemActivity(
  a: import("@/lib/kickbase/types").KbActivity
): string {
  const t = a.t;
  const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
  const mv = data.mv as number | undefined;
  if (t === 3) {
    return mv ? `Marktwert-Update auf ${formatEUR(mv, { compact: true })}` : "Marktwert-Update";
  }
  if (t === 4) return "wurde wieder verfügbar";
  if (t === 12 || t === 13) return "Achievement freigeschaltet";
  return mv ? `Update (${formatEUR(mv, { compact: true })})` : `Liga-Event (Typ ${t})`;
}

function activityIcon(t: number) {
  if (t === 22) return <Wallet className="size-3" />;
  if (t === 1 || t === 2 || t === 3 || t === 15 || t === 16)
    return <ArrowRightLeft className="size-3" />;
  if (t === 12 || t === 13) return <Award className="size-3" />;
  if (t === 26) return <Activity className="size-3" />;
  return null;
}

function describeActivity(a: import("@/lib/kickbase/types").KbActivity): string {
  const t = a.t;
  const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
  const ln = data.ln as string | undefined;
  const fn = data.fn as string | undefined;
  const playerName =
    (data.pn as string) ??
    (data.player as string) ??
    (data.name as string) ??
    (ln ? (fn ? `${fn[0]}. ${ln}` : ln) : undefined);
  const price =
    (data.prc as number) ?? (data.pric as number) ?? (data.mv as number);
  const bonus = data.bn as number | undefined;
  const day = data.day as number | undefined;
  const isSell = t === 2 || t === 16;
  const isBuy = t === 1 || t === 15;

  if (t === 22 || bonus !== undefined) {
    return bonus !== undefined
      ? `erhielt ${formatEUR(bonus, { compact: true })} Bonus${day ? ` (Spieltag ${day})` : ""}`
      : "erhielt einen Bonus";
  }
  if (playerName && price) {
    if (isSell)
      return `verkaufte ${playerName} für ${formatEUR(price, { compact: true })}`;
    return `kaufte ${playerName} für ${formatEUR(price, { compact: true })}`;
  }
  if (playerName) {
    if (isSell) return `verkaufte ${playerName}`;
    if (isBuy) return `kaufte ${playerName}`;
    return `Transfer: ${playerName}`;
  }
  // Generic Transfer ohne playerName (t=3 oder unbekannt) – wenn ein Preis
  // bekannt ist, zeige ihn; sonst zumindest Buy/Sell-Hinweis statt nichtssagendem
  // "tätigte einen Transfer".
  if (price) {
    if (isSell) return `verkaufte einen Spieler für ${formatEUR(price, { compact: true })}`;
    if (isBuy) return `kaufte einen Spieler für ${formatEUR(price, { compact: true })}`;
    return `Transfer für ${formatEUR(price, { compact: true })}`;
  }
  if (isSell) return "verkaufte einen Spieler";
  if (isBuy) return "kaufte einen Spieler";
  if (t === 3) return "tätigte einen Transfer";
  if (t === 12 || t === 13) return "Achievement freigeschaltet";
  if (t === 26) return "Liga-Aktivität";
  return `Aktivität (Typ ${t})`;
}

function formatActivityDate(dt: number | string): string {
  let date: Date;
  if (typeof dt === "string") date = new Date(dt);
  else date = new Date(dt < 1e11 ? dt * 1000 : dt);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  if (diff < 0)
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "jetzt";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}
