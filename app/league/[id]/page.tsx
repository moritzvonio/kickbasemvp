import type { Metadata } from "next";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEUR, formatDelta } from "@/lib/utils";
import { POSITION_LABELS, playerImageUrl, teamMeta } from "@/lib/kickbase/types";
import { ArrowDown, ArrowUp, Minus, Trophy, Wallet, TrendingUp, Users } from "lucide-react";

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

  // Fetch everything in parallel — server components love this
  const [me, squad, ranking, activities] = await Promise.all([
    withKbAuth(path, () => kb.meInLeague(session.token, leagueId)).catch(() => null),
    withKbAuth(path, () => kb.squad(session.token, leagueId)).catch(() => ({ it: [] })),
    withKbAuth(path, () => kb.ranking(session.token, leagueId)).catch(() => ({ us: [], it: [] })),
    withKbAuth(path, () => kb.activities(session.token, leagueId, { max: 12 })).catch(() => ({ it: [] })),
  ]);

  const players = squad.it ?? [];
  const members = ranking.us ?? ranking.it ?? [];
  const meRanking = members.find((m) => m.i === session.userId);

  const positionOrder = [1, 2, 3, 4];
  const grouped = positionOrder.map((pos) => ({
    pos,
    label: POSITION_LABELS[pos],
    players: players.filter((p) => p.pos === pos),
  }));

  // Top movers (mein Squad, 24h)
  const movers = players
    .filter((p) => typeof p.tfhmvt === "number" && p.tfhmvt !== 0)
    .sort((a, b) => Math.abs(b.tfhmvt!) - Math.abs(a.tfhmvt!));
  const topGainers = movers.filter((p) => p.tfhmvt! > 0).slice(0, 3);
  const topLosers = movers.filter((p) => p.tfhmvt! < 0).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Top KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi
          icon={<Trophy className="size-4" />}
          label="Platz"
          value={meRanking?.pl !== undefined ? `#${meRanking.pl}` : "—"}
          sub={members.length ? `von ${members.length}` : undefined}
        />
        <Kpi
          icon={<TrendingUp className="size-4" />}
          label="Punkte"
          value={meRanking?.pt !== undefined ? meRanking.pt.toLocaleString("de-DE") : me?.pt?.toLocaleString("de-DE") ?? "—"}
        />
        <Kpi
          icon={<Wallet className="size-4" />}
          label="Budget"
          value={me?.b !== undefined ? formatEUR(me.b, { compact: true }) : "—"}
        />
        <Kpi
          icon={<Users className="size-4" />}
          label="Teamwert"
          value={me?.tv !== undefined ? formatEUR(me.tv, { compact: true }) : "—"}
        />
      </section>

      {/* My Squad */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mein Team ({players.length})</h2>
          <span className="text-xs text-muted-foreground">
            {players.length > 0 &&
              `Σ ${formatEUR(players.reduce((s, p) => s + (p.mv ?? 0), 0), { compact: true })}`}
          </span>
        </div>
        {players.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              Noch keine Spieler im Kader.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) =>
              g.players.length === 0 ? null : (
                <div key={g.pos}>
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    {g.label} ({g.players.length})
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

      {/* Top Movers (24h, mein Squad) */}
      {(topGainers.length > 0 || topLosers.length > 0) && (
        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-400">
                <ArrowUp className="size-4" /> Top Gewinner (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topGainers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Heute kein Gewinner.</p>
              ) : (
                topGainers.map((p) => (
                  <MoverRow key={p.i} player={p} leagueId={leagueId} positive />
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ArrowDown className="size-4" /> Top Verlierer (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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

      {/* League standings + recent activity, side-by-side on lg */}
      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" />
              Liga-Tabelle
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
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b border-border/60">
                      <th className="text-left font-medium px-5 py-2 w-10">#</th>
                      <th className="text-left font-medium px-2 py-2">Manager</th>
                      <th className="text-right font-medium px-2 py-2">Punkte</th>
                      <th className="text-right font-medium px-2 py-2">Teamwert</th>
                      <th className="text-right font-medium px-5 py-2">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members
                      .slice()
                      .sort((a, b) => (a.pl ?? 99) - (b.pl ?? 99))
                      .map((m) => {
                        const isMe = m.i === session.userId;
                        return (
                          <tr
                            key={m.i}
                            className={
                              "border-b border-border/40 last:border-0 " +
                              (isMe ? "bg-primary/5" : "")
                            }
                          >
                            <td className="px-5 py-2.5 font-mono text-muted-foreground">
                              {m.pl ?? "—"}
                            </td>
                            <td className="px-2 py-2.5">
                              <span className={isMe ? "font-semibold" : ""}>{m.n}</span>
                              {isMe && (
                                <Badge variant="default" className="ml-2 text-[10px]">Du</Badge>
                              )}
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono">
                              {m.pt?.toLocaleString("de-DE") ?? "—"}
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono text-muted-foreground">
                              {m.tv ? formatEUR(m.tv, { compact: true }) : "—"}
                            </td>
                            <td className="px-5 py-2.5 text-right font-mono text-muted-foreground">
                              {m.b ? formatEUR(m.b, { compact: true }) : "—"}
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
              <TrendingUp className="size-4 text-primary" />
              Letzte Aktivitäten
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
                    <div className="flex-1">
                      <span className="font-medium">{a.u?.n ?? "Unbekannt"}</span>{" "}
                      <span className="text-muted-foreground">{describeActivity(a)}</span>
                    </div>
                    {a.dt && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
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

function Kpi({
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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          {icon}
          {label}
        </div>
        <div className="text-xl font-bold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
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
    trend24 > 0 ? "text-emerald-400" : trend24 < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <a
      href={`/league/${leagueId}/spieler/${player.i}`}
      className="block rounded-lg border border-border bg-card hover:border-primary/40 transition-colors p-3 group"
    >
      <div className="flex items-center gap-3">
        <div
          className="size-12 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold"
          style={{ background: `linear-gradient(135deg, ${team.color}33, ${team.color}11)` }}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={player.n} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span style={{ color: team.color }}>{team.short}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{player.n}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>{team.short}</span>
            <span>·</span>
            <span>{POSITION_LABELS[player.pos]}</span>
            {player.p !== undefined && (
              <>
                <span>·</span>
                <span>{player.p} P</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm">
            {formatEUR(player.mv, { compact: true })}
          </div>
          <div className={`text-xs flex items-center justify-end gap-0.5 ${trendColor}`}>
            <TrendIcon className="size-3" />
            <span className="font-mono">{trend24 ? formatDelta(trend24) : "0"}</span>
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
  return (
    <a
      href={`/league/${leagueId}/spieler/${player.i}`}
      className="flex items-center gap-3 px-2 py-1.5 -mx-2 rounded-md hover:bg-accent transition-colors"
    >
      <div
        className="size-8 rounded shrink-0 flex items-center justify-center text-[10px] font-bold"
        style={{ background: `linear-gradient(135deg, ${team.color}33, ${team.color}11)`, color: team.color }}
      >
        {team.short}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{player.n}</div>
        <div className="text-xs text-muted-foreground">
          {formatEUR(player.mv, { compact: true })}
        </div>
      </div>
      <div className={`text-right font-mono text-sm ${positive ? "text-emerald-400" : "text-destructive"}`}>
        {formatDelta(trend)}
      </div>
    </a>
  );
}

function describeActivity(a: import("@/lib/kickbase/types").KbActivity): string {
  // Activity type codes are partially reverse-engineered; fall back to "Aktivität"
  const t = a.t;
  const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
  const playerName = (data.pn as string) ?? (data.player as string);

  if (t === 1) return playerName ? `kaufte ${playerName}` : "tätigte einen Kauf";
  if (t === 2) return playerName ? `verkaufte ${playerName}` : "verkaufte einen Spieler";
  if (t === 3) return "tätigte einen Transfer";
  if (t === 12) return "schaltete ein Achievement frei";
  if (t === 15) return "stellte eine Aufstellung";
  return "Aktivität";
}

function formatActivityDate(dt: number | string): string {
  let date: Date;
  if (typeof dt === "string") {
    date = new Date(dt);
  } else {
    // Heuristic: if dt < 10^11 it's seconds; otherwise ms
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
