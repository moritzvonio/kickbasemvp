import type { Metadata } from "next";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEUR, formatDelta } from "@/lib/utils";
import {
  POSITION_LABELS,
  playerImageUrl,
  teamMeta,
  KICKBASE_CDN,
} from "@/lib/kickbase/types";
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
  Sparkles,
  Calendar,
  Flame,
  ShoppingCart,
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
  const emptyActivities = { it: [] } as Awaited<ReturnType<typeof kb.activities>>;

  const [budget, squad, ranking, activities] = await Promise.all([
    withKbAuth(path, () => kb.meInLeague(session.token, leagueId)).catch(() => null),
    withKbAuth(path, () => kb.squad(session.token, leagueId)).catch(() => emptySquad),
    withKbAuth(path, () => kb.ranking(session.token, leagueId)).catch(() => emptyRanking),
    withKbAuth(path, () => kb.activities(session.token, leagueId, { max: 12 })).catch(() => emptyActivities),
  ]);

  const players = squad.it ?? [];
  const members = (ranking.us ?? ranking.it ?? []).slice().sort((a, b) => (a.spl ?? 99) - (b.spl ?? 99));
  const meRanking = members.find((m) => m.i === session.userId);
  const leagueName = ranking.ti ?? budget?.lnm ?? "Liga";
  const seasonName = ranking.sn;
  const matchday = ranking.day;
  const totalMatchdays = ranking.nd;

  const myTeamValue = players.reduce((s, p) => s + (p.mv ?? 0), 0);
  const myMatchdayPts = meRanking?.mdp;
  const myLastPts = meRanking?.lp?.filter((p): p is number => typeof p === "number").slice(-3) ?? [];

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
      {/* League header strip */}
      <section>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Trophy className="size-5" />
              </span>
              {leagueName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
              {seasonName && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  Saison {seasonName}
                </span>
              )}
              {matchday !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Flame className="size-3.5" />
                  Spieltag {matchday}
                  {totalMatchdays && ` / ${totalMatchdays}`}
                </span>
              )}
              {members.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5" />
                  {members.length} Manager
                </span>
              )}
            </p>
          </div>
          {meRanking && meRanking.spl === 1 && (
            <Badge variant="success" className="gap-1">
              <Crown className="size-3" /> Tabellenführer
            </Badge>
          )}
        </div>
      </section>

      {/* Top KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi
          icon={<Trophy className="size-4" />}
          label="Platz"
          value={meRanking?.spl !== undefined ? `#${meRanking.spl}` : "—"}
          sub={members.length ? `von ${members.length}` : undefined}
          accent="primary"
        />
        <Kpi
          icon={<TrendingUp className="size-4" />}
          label="Punkte gesamt"
          value={meRanking?.sp !== undefined ? meRanking.sp.toLocaleString("de-DE") : "—"}
          sub={myMatchdayPts !== undefined ? `+${myMatchdayPts.toLocaleString("de-DE")} Spieltag ${matchday ?? ""}`.trim() : undefined}
        />
        <Kpi
          icon={<Wallet className="size-4" />}
          label="Budget"
          value={budget?.b !== undefined ? formatEUR(budget.b, { compact: true }) : "—"}
        />
        <Kpi
          icon={<Users className="size-4" />}
          label="Teamwert"
          value={meRanking?.tv !== undefined ? formatEUR(meRanking.tv, { compact: true }) : (myTeamValue ? formatEUR(myTeamValue, { compact: true }) : "—")}
          sub={`${players.length} Spieler`}
        />
      </section>

      {/* Mein Team */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="size-5 text-primary" /> Mein Team
          </h2>
          <span className="text-xs text-muted-foreground">
            {players.length} Spieler · Σ {formatEUR(myTeamValue, { compact: true })}
          </span>
        </div>
        {players.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Noch keine Spieler im Kader.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) =>
              g.players.length === 0 ? null : (
                <div key={g.pos}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1 flex items-center gap-2">
                    <span className="inline-block w-1 h-3 bg-primary rounded-full" />
                    {g.label}
                    <span className="font-normal normal-case tracking-normal">({g.players.length})</span>
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
        <section className="grid gap-4 md:grid-cols-2">
          <Card className="card-hover overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-600">
                <ArrowUp className="size-4" /> Gewinner heute
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
              <CardTitle className="flex items-center gap-2 text-rose-600">
                <ArrowDown className="size-4" /> Verlierer heute
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
      <section className="grid gap-4 lg:grid-cols-5">
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
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground bg-muted/40">
                    <tr>
                      <th className="text-left font-medium px-5 py-2 w-10">#</th>
                      <th className="text-left font-medium px-2 py-2">Manager</th>
                      <th className="text-right font-medium px-2 py-2">Punkte</th>
                      <th className="text-right font-medium px-2 py-2 hidden sm:table-cell">Spieltag</th>
                      <th className="text-right font-medium px-5 py-2">Teamwert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const isMe = m.i === session.userId;
                      const lastTwo = (m.lp ?? []).filter((p): p is number => typeof p === "number").slice(-2);
                      return (
                        <tr
                          key={m.i}
                          className={
                            "border-b border-border/40 last:border-0 transition-colors hover:bg-accent/40 " +
                            (isMe ? "bg-primary/[0.06]" : "")
                          }
                        >
                          <td className="px-5 py-2.5 font-mono text-muted-foreground">
                            {placementBadge(m.spl)}
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <UserAvatar name={m.n} image={m.uim} />
                              <div className="min-w-0">
                                <span className={"truncate " + (isMe ? "font-semibold" : "")}>{m.n}</span>
                                {isMe && (
                                  <Badge variant="default" className="ml-2 text-[10px]">Du</Badge>
                                )}
                                {m.adm && (
                                  <Badge variant="muted" className="ml-1 text-[10px]">Admin</Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-right font-mono font-medium">
                            {m.sp?.toLocaleString("de-DE") ?? "—"}
                          </td>
                          <td className="px-2 py-2.5 text-right font-mono text-muted-foreground hidden sm:table-cell">
                            {m.mdp !== undefined ? `+${m.mdp.toLocaleString("de-DE")}` : "—"}
                          </td>
                          <td className="px-5 py-2.5 text-right font-mono text-muted-foreground">
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
          <CardContent className="space-y-3">
            {(activities.it ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Aktivitäten gefunden.
              </p>
            ) : (
              (activities.it ?? []).slice(0, 12).map((a) => (
                <div key={a.i} className="text-sm border-b border-border/40 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 flex items-start gap-2 min-w-0">
                      <UserAvatar name={a.u?.n ?? "?"} image={a.u?.uim} size="xs" />
                      <div className="min-w-0">
                        <span className="font-medium truncate">{a.u?.n ?? "Unbekannt"}</span>{" "}
                        <span className="text-muted-foreground">{describeActivity(a)}</span>
                      </div>
                    </div>
                    {a.dt && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {formatActivityDate(a.dt)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function placementBadge(pl?: number) {
  if (pl === undefined) return "—";
  if (pl === 1) return <span className="inline-flex items-center justify-center size-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">🥇</span>;
  if (pl === 2) return <span className="inline-flex items-center justify-center size-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">🥈</span>;
  if (pl === 3) return <span className="inline-flex items-center justify-center size-7 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">🥉</span>;
  return pl;
}

function UserAvatar({ name, image, size = "sm" }: { name: string; image?: string; size?: "xs" | "sm" }) {
  const px = size === "xs" ? "size-6 text-[10px]" : "size-7 text-[11px]";
  if (image) {
    const url = image.startsWith("http") ? image : `${KICKBASE_CDN}/${image.replace(/^\//, "")}`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={`${px} rounded-full shrink-0 object-cover bg-muted`}
        loading="lazy"
      />
    );
  }
  const initial = (name?.[0] ?? "?").toUpperCase();
  return (
    <span className={`${px} rounded-full shrink-0 bg-primary/15 text-primary inline-flex items-center justify-center font-semibold`}>
      {initial}
    </span>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: "primary";
}) {
  return (
    <Card className="card-hover overflow-hidden relative">
      {accent === "primary" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-emerald-300" />
      )}
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
          <span className="inline-flex size-6 rounded-md bg-primary/10 text-primary items-center justify-center">
            {icon}
          </span>
          {label}
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function PlayerCard({
  player,
  leagueId,
}: {
  player: import("@/lib/kickbase/types").KbSquadPlayer;
  leagueId: string;
}) {
  const team = teamMeta(player.tid);
  const img = playerImageUrl(player.pim);
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
        <div
          className="size-12 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold ring-1 ring-border"
          style={{ background: `linear-gradient(135deg, ${team.color}22, ${team.color}08)` }}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={player.n} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span style={{ color: team.color }}>{team.short}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate flex items-center gap-1">
            {player.n}
            {player.iotm && (
              <ShoppingCart className="size-3 text-primary shrink-0" aria-label="Auf Markt" />
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: `${team.color}1a`, color: team.color }}
            >
              {team.short}
            </span>
            <span>{POSITION_LABELS[player.pos]}</span>
            {player.p !== undefined && (
              <>
                <span>·</span>
                <span className="font-mono">{player.p} Pkt</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-sm font-semibold">
            {formatEUR(player.mv, { compact: true })}
          </div>
          <div className={`text-xs flex items-center justify-end gap-0.5 font-mono ${trendColor}`}>
            <TrendIcon className="size-3" />
            <span>{trend24 ? formatDelta(trend24) : "0"}</span>
          </div>
        </div>
      </div>
    </a>
  );
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
  const img = playerImageUrl(player.pim);
  return (
    <a
      href={`/league/${leagueId}/spieler/${player.i}`}
      className="flex items-center gap-3 px-2 py-2 -mx-2 rounded-lg hover:bg-accent transition-colors"
    >
      <div
        className="size-9 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold ring-1 ring-border"
        style={{ background: `linear-gradient(135deg, ${team.color}22, ${team.color}08)`, color: team.color }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={player.n} className="w-full h-full object-cover" />
        ) : (
          team.short
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate">{player.n}</div>
        <div className="text-xs text-muted-foreground">
          {team.short} · {formatEUR(player.mv, { compact: true })}
        </div>
      </div>
      <div className={`text-right font-mono text-sm font-semibold ${positive ? "text-emerald-600" : "text-rose-600"}`}>
        {formatDelta(trend)}
      </div>
    </a>
  );
}

function describeActivity(a: import("@/lib/kickbase/types").KbActivity): string {
  const t = a.t;
  const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
  const playerName = (data.pn as string) ?? (data.player as string) ?? (data.name as string);
  const price = (data.prc as number) ?? (data.pric as number);

  if (t === 1) return playerName ? `kaufte ${playerName}${price ? ` für ${formatEUR(price, { compact: true })}` : ""}` : "tätigte einen Kauf";
  if (t === 2) return playerName ? `verkaufte ${playerName}${price ? ` für ${formatEUR(price, { compact: true })}` : ""}` : "verkaufte einen Spieler";
  if (t === 3) return "tätigte einen Transfer";
  if (t === 12) return "schaltete ein Achievement frei";
  if (t === 15) return "stellte eine Aufstellung";
  return "Aktivität";
}

function formatActivityDate(dt: number | string): string {
  let date: Date;
  if (typeof dt === "string") date = new Date(dt);
  else date = new Date(dt < 1e11 ? dt * 1000 : dt);
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
