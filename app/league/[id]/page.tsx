import type { Metadata } from "next";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TeamCrest } from "@/components/ui/team-tag";
import { PositionBadge } from "@/components/ui/position-icon";
import { FormDots } from "@/components/ui/form-dots";
import { Sparkline } from "@/components/ui/sparkline";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEUR, formatDelta } from "@/lib/utils";
import { POSITION_LABELS, teamMeta } from "@/lib/kickbase/types";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { TeamTag } from "@/components/ui/team-tag";
import {
  ArrowDown,
  ArrowUp,
  Minus,
  Trophy,
  Wallet,
  TrendingUp,
  Users,
  Crown,
  Activity,
  Calendar,
  Flame,
  ShoppingCart,
  ArrowRightLeft,
  Award,
  Layers,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function LeagueDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: leagueId } = await params;
  const path = `/league/${leagueId}`;
  const session = await requireSessionOrRedirect(path);

  const emptyRanking = {} as Awaited<ReturnType<typeof kb.ranking>>;
  const emptySquad = { it: [] } as Awaited<ReturnType<typeof kb.squad>>;
  const emptyActivities = { af: [] } as Awaited<ReturnType<typeof kb.activities>>;

  const [budget, squad, ranking, activities] = await Promise.all([
    withKbAuth(path, () => kb.myBudget(session.token, leagueId)).catch(() => null),
    withKbAuth(path, () => kb.squad(session.token, leagueId)).catch(() => emptySquad),
    withKbAuth(path, () => kb.ranking(session.token, leagueId)).catch(() => emptyRanking),
    withKbAuth(path, () => kb.activities(session.token, leagueId, { max: 12 })).catch(() => emptyActivities),
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

  const myTeamValue = players.reduce((s, p) => s + (p.mv ?? 0), 0);
  const myMatchdayPts = meRanking?.mdp;
  const myLastPoints = meRanking?.lp ?? [];

  const positionOrder = [1, 2, 3, 4];
  const grouped = positionOrder.map((pos) => ({
    pos,
    label: POSITION_LABELS[pos],
    players: players.filter((p) => p.pos === pos),
  }));

  const movers = players
    .filter((p) => typeof p.tfhmvt === "number" && p.tfhmvt !== 0)
    .sort((a, b) => Math.abs(b.tfhmvt!) - Math.abs(a.tfhmvt!));
  const topGainers = movers.filter((p) => p.tfhmvt! > 0).slice(0, 3);
  const topLosers = movers.filter((p) => p.tfhmvt! < 0).slice(0, 3);

  return (
    <div className="space-y-8">
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

      {/* Top KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 slide-up slide-up-1">
        <StatCard
          icon={<Trophy className="size-4" />}
          label="Platz"
          value={meRanking?.spl !== undefined ? `#${meRanking.spl}` : "—"}
          sub={members.length ? `von ${members.length}` : undefined}
          accent="primary"
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Punkte"
          value={meRanking?.sp !== undefined ? meRanking.sp.toLocaleString("de-DE") : "—"}
          sub={
            myMatchdayPts !== undefined ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-emerald-600 font-mono font-medium">
                  +{myMatchdayPts.toLocaleString("de-DE")}
                </span>
                <span>Spieltag</span>
              </span>
            ) : undefined
          }
          accent="success"
        />
        <StatCard
          icon={<Users className="size-4" />}
          label="Teamwert"
          value={
            meRanking?.tv !== undefined
              ? formatEUR(meRanking.tv, { compact: true })
              : myTeamValue
              ? formatEUR(myTeamValue, { compact: true })
              : "—"
          }
          sub={`${players.length} Spieler`}
          accent="primary"
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Netto-Teamwert"
          value={(() => {
            const tv = meRanking?.tv ?? myTeamValue ?? 0;
            const cash = budget?.b ?? 0;
            return formatEUR(tv + cash, { compact: true });
          })()}
          sub="TV + Cash"
          accent="success"
        />
        <StatCard
          icon={<Wallet className="size-4" />}
          label="Budget"
          value={budget?.b !== undefined ? formatEUR(budget.b, { compact: true }) : "—"}
          accent="info"
        />
      </section>

      {/* Form (last 5 matchdays) */}
      {myLastPoints.filter((p) => p !== null && p !== undefined).length > 0 && (
        <Card className="slide-up slide-up-2">
          <CardContent className="p-5 flex flex-wrap items-center gap-5 justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                Form letzte 5 Spieltage
              </div>
              <FormDots points={myLastPoints} />
            </div>
            <div className="flex-1 min-w-[140px]">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 text-right">
                Punkte-Trend
              </div>
              <Sparkline
                values={myLastPoints}
                width={200}
                height={36}
                color="#10b981"
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mein Team */}
      <section className="space-y-3 slide-up slide-up-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="size-5 text-primary" /> Mein Team
          </h2>
          <span className="text-xs text-muted-foreground tabular">
            {players.length} Spieler · Σ {formatEUR(myTeamValue, { compact: true })}
          </span>
        </div>
        {players.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Layers className="size-6" />}
              title="Noch keine Spieler im Kader"
              description="Geh in die Kickbase-App und kauf deine ersten Spieler."
            />
          </Card>
        ) : (
          <div className="space-y-5">
            {grouped.map((g) =>
              g.players.length === 0 ? null : (
                <div key={g.pos}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <PositionBadge pos={g.pos} />
                    <span className="text-xs text-muted-foreground">
                      {g.players.length} Spieler · Σ{" "}
                      {formatEUR(
                        g.players.reduce((s, p) => s + (p.mv ?? 0), 0),
                        { compact: true }
                      )}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {g.players.map((p) => (
                      <PlayerCard key={p.i} player={p} leagueId={leagueId} />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Top Movers */}
      {(topGainers.length > 0 || topLosers.length > 0) && (
        <section className="grid gap-4 md:grid-cols-2 slide-up slide-up-4">
          <Card className="card-hover overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <span className="size-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <ArrowUp className="size-4" />
                </span>
                Gewinner heute
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {topGainers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Heute kein Gewinner.</p>
              ) : (
                topGainers.map((p) => (
                  <MoverRow key={p.i} player={p} leagueId={leagueId} positive />
                ))
              )}
            </CardContent>
          </Card>
          <Card className="card-hover overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-rose-300" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700">
                <span className="size-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
                  <ArrowDown className="size-4" />
                </span>
                Verlierer heute
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {topLosers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Heute kein Verlierer.</p>
              ) : (
                topLosers.map((p) => (
                  <MoverRow key={p.i} player={p} leagueId={leagueId} />
                ))
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Liga-Tabelle + Activity */}
      <section className="grid gap-4 lg:grid-cols-5 slide-up slide-up-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" />
              Liga-Tabelle
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
                      <th className="text-right pr-5">Teamwert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const isMe = m.i === session.userId;
                      return (
                        <tr key={m.i} className={isMe ? "bg-primary/[0.06]" : ""}>
                          <td className="pl-5">{placementBadge(m.spl)}</td>
                          <td>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar name={m.n} image={m.uim} size="sm" />
                              <div className="min-w-0 flex items-center gap-2">
                                <span className={"truncate " + (isMe ? "font-semibold" : "")}>
                                  {m.n}
                                </span>
                                {isMe && (
                                  <Badge variant="default" className="text-[10px] py-0">
                                    Du
                                  </Badge>
                                )}
                                {m.adm && (
                                  <Badge variant="muted" className="text-[10px] py-0">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-right font-mono font-semibold">
                            {m.sp?.toLocaleString("de-DE") ?? "—"}
                          </td>
                          <td className="text-right font-mono text-emerald-700 hidden sm:table-cell">
                            {m.mdp !== undefined ? `+${m.mdp.toLocaleString("de-DE")}` : "—"}
                          </td>
                          <td className="text-right font-mono text-muted-foreground pr-5">
                            {m.tv ? formatEUR(m.tv, { compact: true }) : "—"}
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Liga-Aktivität
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {(() => {
              const list = activities.af ?? activities.it ?? [];
              if (list.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground">
                    Keine Aktivitäten gefunden.
                  </p>
                );
              }
              return list.slice(0, 12).map((a) => (
                <ActivityRow key={a.i} activity={a} />
              ));
            })()}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function placementBadge(pl?: number) {
  if (pl === undefined) return <span className="text-muted-foreground">—</span>;
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

function PlayerCard({
  player,
  leagueId,
}: {
  player: import("@/lib/kickbase/types").KbSquadPlayer;
  leagueId: string;
}) {
  const trend24 = player.tfhmvt ?? 0;
  const TrendIcon = trend24 > 0 ? ArrowUp : trend24 < 0 ? ArrowDown : Minus;
  const trendColor =
    trend24 > 0 ? "text-emerald-600" : trend24 < 0 ? "text-rose-600" : "text-muted-foreground";

  return (
    <a
      href={`/league/${leagueId}/spieler/${player.i}`}
      className="card-hover block rounded-xl border border-border bg-card p-3 group"
    >
      <div className="flex items-center gap-3">
        <PlayerAvatar pim={player.pim} tid={player.tid} size={48} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate flex items-center gap-1">
            {player.n}
            {player.iotm && (
              <ShoppingCart className="size-3 text-primary shrink-0" />
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5">
            <TeamTag tid={player.tid} size="sm" />
            <PlayerPointsLabel p={player.p} tp={player.tp} ap={player.ap} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-sm font-bold tabular">
            {formatEUR(player.mv, { compact: true })}
          </div>
          <div className={`text-xs flex items-center justify-end gap-0.5 font-mono tabular ${trendColor}`}>
            <TrendIcon className="size-3" />
            <span>{trend24 ? formatDelta(trend24) : "0"}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function PlayerPointsLabel({
  p,
  tp,
  ap,
}: {
  p?: number;
  tp?: number;
  ap?: number;
}) {
  // Prefer absolute points; fall back to total or average if 0/undef.
  const total = (p && p > 0) ? p : (tp && tp > 0) ? tp : undefined;
  if (total !== undefined) {
    return <span className="font-mono tabular">{total.toLocaleString("de-DE")} Pkt</span>;
  }
  if (ap !== undefined && ap > 0) {
    return <span className="font-mono tabular">Ø {ap}</span>;
  }
  return null;
}

function MoverRow({
  player,
  leagueId,
  positive,
}: {
  player: import("@/lib/kickbase/types").KbSquadPlayer;
  leagueId: string;
  positive?: boolean;
}) {
  const team = teamMeta(player.tid);
  const trend = player.tfhmvt ?? 0;
  return (
    <a
      href={`/league/${leagueId}/spieler/${player.i}`}
      className="flex items-center gap-3 px-2 py-2 -mx-2 rounded-lg hover:bg-accent/60 transition-colors"
    >
      <PlayerAvatar pim={player.pim} tid={player.tid} size={36} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate">{player.n}</div>
        <div className="text-xs text-muted-foreground tabular flex items-center gap-1.5">
          <TeamTag tid={player.tid} size="xs" />
          <span>{formatEUR(player.mv, { compact: true })}</span>
        </div>
      </div>
      <div
        className={`text-right font-mono text-sm font-bold tabular ${
          positive ? "text-emerald-600" : "text-rose-600"
        }`}
      >
        {formatDelta(trend)}
      </div>
    </a>
  );
}

function ActivityRow({ activity }: { activity: import("@/lib/kickbase/types").KbActivity }) {
  const icon = activityIcon(activity.t);
  const hasUser = !!activity.u?.n;
  return (
    <div className="text-sm border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
      <div className="flex items-start gap-2.5">
        {hasUser ? (
          <UserAvatar name={activity.u!.n} image={activity.u!.uim} size="xs" />
        ) : (
          <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/20">
            {icon ?? <Activity className="size-3" />}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            {hasUser && <span className="font-semibold">{activity.u!.n}</span>}
            {hasUser ? " " : ""}
            <span className={hasUser ? "text-muted-foreground" : "font-medium"}>
              {describeActivity(activity)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasUser && icon && (
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
  const playerName =
    (data.pn as string) ?? (data.player as string) ?? (data.name as string);
  const price = (data.prc as number) ?? (data.pric as number);
  const bonus = data.bn as number | undefined;
  const day = data.day as number | undefined;

  if (t === 22 || bonus !== undefined) {
    return bonus !== undefined
      ? `erhielt ${formatEUR(bonus, { compact: true })} Bonus${day ? ` (Spieltag ${day})` : ""}`
      : "erhielt einen Bonus";
  }
  if (playerName && price) {
    if (t === 2 || t === 16) return `verkaufte ${playerName} für ${formatEUR(price, { compact: true })}`;
    return `kaufte ${playerName} für ${formatEUR(price, { compact: true })}`;
  }
  if (playerName) {
    if (t === 2 || t === 16) return `verkaufte ${playerName}`;
    if (t === 1 || t === 15) return `kaufte ${playerName}`;
    return `Aktivität mit ${playerName}`;
  }
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
  if (diff < 0) return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "jetzt";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}
