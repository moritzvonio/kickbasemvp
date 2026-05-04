import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { TeamTag } from "@/components/ui/team-tag";
import { PositionBadge } from "@/components/ui/position-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { BatteryBar } from "@/components/ui/point-bar";
import { formatEUR, formatDelta, cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Wallet,
  Flame,
  Activity,
  ShoppingCart,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export const metadata: Metadata = { title: "Trading" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TradingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: leagueId } = await params;
  const path = `/league/${leagueId}/trading`;
  const session = await requireSessionOrRedirect(path);

  const [squad, market, budget] = await Promise.all([
    withKbAuth(path, () => kb.squad(session.token, leagueId)).catch(() => ({ it: [] } as Awaited<ReturnType<typeof kb.squad>>)),
    withKbAuth(path, () => kb.market(session.token, leagueId)).catch(() => ({ it: [] } as Awaited<ReturnType<typeof kb.market>>)),
    withKbAuth(path, () => kb.meInLeague(session.token, leagueId)).catch(() => null),
  ]);

  const players = squad.it ?? [];
  const teamValue = players.reduce((s, p) => s + (p.mv ?? 0), 0);
  const dayGain = players.reduce((s, p) => s + (p.tfhmvt ?? 0), 0);
  const totalProfit = players.reduce((s, p) => s + (p.mvgl ?? 0), 0);
  const onMarket = players.filter((p) => p.iotm).length;

  const sortedByDay = players
    .slice()
    .sort((a, b) => (b.tfhmvt ?? 0) - (a.tfhmvt ?? 0));
  const topGainers = sortedByDay.filter((p) => (p.tfhmvt ?? 0) > 0);
  const topLosers = sortedByDay.filter((p) => (p.tfhmvt ?? 0) < 0).reverse();

  const sortedByProfit = players
    .slice()
    .sort((a, b) => (b.mvgl ?? 0) - (a.mvgl ?? 0));

  // Market opportunities: positive mvt (rising), low offer (cheap relative to MV)
  const marketRisers = (market.it ?? [])
    .filter((m) => (m.mvt ?? 0) > 0)
    .sort((a, b) => (b.mvt ?? 0) - (a.mvt ?? 0))
    .slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Activity className="size-5" />
          </span>
          Trading
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Tageszahlen deines Squads + Auto-Targets aus dem Transfermarkt.
        </p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 slide-up slide-up-1">
        <StatCard
          icon={<Flame className="size-4" />}
          label="Tagesgewinn"
          value={dayGain ? formatDelta(dayGain) : "0 €"}
          sub="Σ 24h-Veränderung"
          accent={dayGain > 0 ? "success" : dayGain < 0 ? "danger" : "info"}
          trend={dayGain > 0 ? "up" : dayGain < 0 ? "down" : "flat"}
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Saison-Profit"
          value={totalProfit ? formatDelta(totalProfit) : "0 €"}
          sub="Σ MV − Kaufpreis"
          accent={totalProfit > 0 ? "success" : totalProfit < 0 ? "danger" : "info"}
        />
        <StatCard
          icon={<Wallet className="size-4" />}
          label="Teamwert"
          value={formatEUR(teamValue, { compact: true })}
          sub={`${players.length} Spieler`}
          accent="primary"
        />
        <StatCard
          icon={<ShoppingCart className="size-4" />}
          label="Auf Markt"
          value={String(onMarket)}
          sub={budget?.b !== undefined ? `Budget: ${formatEUR(budget.b, { compact: true })}` : undefined}
          accent="warning"
        />
      </section>

      {/* My Squad — Movers (gainers + losers) side by side */}
      <section className="grid gap-4 lg:grid-cols-2 slide-up slide-up-2">
        <Card className="overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300" />
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-emerald-700">
                <span className="size-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <ArrowUpRight className="size-4" />
                </span>
                Squad-Steiger heute
              </span>
              {topGainers.length > 0 && (
                <span className="text-xs font-mono text-emerald-700 tabular">
                  +{formatEUR(topGainers.reduce((s, p) => s + (p.tfhmvt ?? 0), 0), { compact: true })}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {topGainers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Heute kein Spieler im Plus.
              </p>
            ) : (
              topGainers.slice(0, 6).map((p) => (
                <SquadMover key={p.i} player={p} leagueId={leagueId} positive />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-rose-300" />
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-rose-700">
                <span className="size-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
                  <ArrowDownRight className="size-4" />
                </span>
                Squad-Verlierer heute
              </span>
              {topLosers.length > 0 && (
                <span className="text-xs font-mono text-rose-700 tabular">
                  {formatEUR(topLosers.reduce((s, p) => s + (p.tfhmvt ?? 0), 0), { compact: true })}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {topLosers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Heute kein Spieler im Minus.
              </p>
            ) : (
              topLosers.slice(0, 6).map((p) => (
                <SquadMover key={p.i} player={p} leagueId={leagueId} />
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* Squad — Saison-Profit Liste (alle Spieler) */}
      <section className="slide-up slide-up-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="size-4" />
              </span>
              Saison-Profit pro Spieler
              <span className="ml-auto text-xs font-mono text-muted-foreground tabular">
                Σ {formatDelta(totalProfit)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {sortedByProfit.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Keine Spieler im Squad.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th className="text-left pl-5">Spieler</th>
                      <th className="text-right">Marktwert</th>
                      <th className="text-right hidden sm:table-cell">Kaufpreis</th>
                      <th className="text-right pr-5">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByProfit.map((p) => {
                      const profit = p.mvgl ?? 0;
                      const purchase = (p.mv ?? 0) - profit;
                      const profitPct = purchase > 0 ? (profit / purchase) * 100 : 0;
                      return (
                        <tr key={p.i}>
                          <td className="pl-5">
                            <Link
                              href={`/league/${leagueId}/spieler/${p.i}`}
                              className="flex items-center gap-2 min-w-0 hover:text-primary transition-colors"
                            >
                              <PlayerAvatar pim={p.pim} tid={p.tid} size={32} />
                              <div className="min-w-0">
                                <div className="font-medium text-sm truncate">{p.n}</div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <TeamTag tid={p.tid} size="xs" />
                                  <PositionBadge pos={p.pos} className="text-[9px] h-4 px-1" />
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="text-right font-mono tabular">
                            {formatEUR(p.mv ?? 0, { compact: true })}
                          </td>
                          <td className="text-right font-mono tabular text-muted-foreground hidden sm:table-cell">
                            {formatEUR(purchase, { compact: true })}
                          </td>
                          <td className="text-right pr-5">
                            <div
                              className={cn(
                                "font-mono font-semibold tabular",
                                profit > 0
                                  ? "text-emerald-600"
                                  : profit < 0
                                  ? "text-rose-600"
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatDelta(profit)}
                            </div>
                            {Math.abs(profitPct) >= 0.1 && (
                              <div
                                className={cn(
                                  "text-[10px] tabular font-mono",
                                  profit > 0
                                    ? "text-emerald-600/80"
                                    : "text-rose-600/80"
                                )}
                              >
                                {profit > 0 ? "+" : ""}
                                {profitPct.toFixed(1)}%
                              </div>
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
      </section>

      {/* Auto-Targets aus dem Markt */}
      <section className="slide-up slide-up-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Target className="size-4" />
              </span>
              Auto-Targets aus dem Markt
              <Badge variant="muted" className="ml-auto text-[10px]">
                {marketRisers.length} steigen
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketRisers.length === 0 ? (
              <EmptyState
                icon={<Target className="size-6" />}
                title="Keine steigenden Markt-Spieler"
                description="Im Transfermarkt deiner Liga gibt es aktuell keine Spieler mit positivem MV-Trend."
              />
            ) : (
              <div className="grid gap-2">
                {marketRisers.map((p) => {
                  const pid = p.pi ?? p.i ?? "";
                  const priceDiff = p.prc - p.mv;
                  const priceDiffPct = p.mv > 0 ? (priceDiff / p.mv) * 100 : 0;
                  return (
                    <Link
                      key={pid}
                      href={`/league/${leagueId}/spieler/${pid}`}
                      className="card-hover flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card"
                    >
                      <PlayerAvatar pim={p.pim} tid={p.tid} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate text-sm flex items-center gap-1.5">
                          {p.n}
                          <Badge variant="success" className="text-[9px] gap-0.5">
                            <TrendingUp className="size-2.5" /> steigt
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <TeamTag tid={p.tid} size="xs" />
                          <PositionBadge pos={p.pos} className="text-[9px] h-4 px-1" />
                          {p.u?.n && <span className="truncate">von {p.u.n}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm tabular">
                          {formatEUR(p.prc, { compact: true })}
                        </div>
                        <div
                          className={cn(
                            "text-[10px] font-mono tabular",
                            priceDiff > 0
                              ? "text-amber-600"
                              : "text-emerald-600"
                          )}
                        >
                          {priceDiff > 0 ? "+" : ""}
                          {priceDiffPct.toFixed(0)}% vs MV
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground text-center pt-2 leading-relaxed">
        💡 Marktwerte ändern sich täglich um 22:00 Uhr basierend auf Form + Nachfrage.
        <br />
        Auto-Targets = aktuelle Markt-Listings mit positivem MV-Trend.
      </p>
    </div>
  );
}

function SquadMover({
  player,
  leagueId,
  positive,
}: {
  player: import("@/lib/kickbase/types").KbSquadPlayer;
  leagueId: string;
  positive?: boolean;
}) {
  const trend = player.tfhmvt ?? 0;
  return (
    <Link
      href={`/league/${leagueId}/spieler/${player.i}`}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-accent/60 transition-colors"
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
        className={cn(
          "text-right font-mono text-sm font-bold tabular",
          positive ? "text-emerald-600" : "text-rose-600"
        )}
      >
        {formatDelta(trend)}
      </div>
    </Link>
  );
}
