import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEUR, formatDelta } from "@/lib/utils";
import {
  POSITION_LABELS,
  playerImageUrl,
  teamMeta,
  dtDayToDate,
  type KbMarketValuePoint,
} from "@/lib/kickbase/types";
import { ArrowLeft, ArrowDown, ArrowUp, Minus, TrendingUp, Target, ShoppingCart } from "lucide-react";
import { MarketValueChart } from "./MarketValueChart";
import { WatchButton } from "./WatchButton";
import { isWatched } from "@/lib/watchlist";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; pid: string }>;
}): Promise<Metadata> {
  const { id, pid } = await params;
  try {
    const session = await requireSessionOrRedirect(`/league/${id}/spieler/${pid}`);
    const p = await kb.player(session.token, id, pid);
    return { title: `${p.fn ? p.fn + " " : ""}${p.n}` };
  } catch {
    return { title: "Spieler" };
  }
}

interface ChartPoint {
  ts: number;
  date: string;
  mv: number;
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string; pid: string }>;
}) {
  const { id: leagueId, pid: playerId } = await params;
  const path = `/league/${leagueId}/spieler/${playerId}`;
  const session = await requireSessionOrRedirect(path);

  const [player, mv92, perf, watched] = await Promise.all([
    withKbAuth(path, () => kb.player(session.token, leagueId, playerId)).catch(() => null),
    withKbAuth(path, () => kb.marketValue(session.token, leagueId, playerId, 92)).catch(() => null),
    withKbAuth(path, () => kb.performance(session.token, leagueId, playerId)).catch(() => null),
    isWatched(playerId),
  ]);

  if (!player) notFound();

  const team = teamMeta(player.tid);
  const img = playerImageUrl(player.pim);

  const points: ChartPoint[] = (mv92?.it ?? []).map((p: KbMarketValuePoint) => ({
    ts: p.dt,
    date: dtDayToDate(p.dt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
    mv: p.mv,
  }));

  const trend24 = (player as { tfhmvt?: number }).tfhmvt ?? 0;
  const TrendIcon = trend24 > 0 ? ArrowUp : trend24 < 0 ? ArrowDown : Minus;
  const trendColor =
    trend24 > 0 ? "text-emerald-400" : trend24 < 0 ? "text-destructive" : "text-muted-foreground";

  // Compute change since first point (e.g. 92 days ago)
  const firstMv = points[0]?.mv;
  const lastMv = points[points.length - 1]?.mv ?? player.mv;
  const change92 = firstMv && lastMv ? lastMv - firstMv : 0;
  const change92Pct = firstMv ? (change92 / firstMv) * 100 : 0;

  return (
    <div className="space-y-6">
      <Link
        href={`/league/${leagueId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Dashboard
      </Link>

      {/* Player header */}
      <div className="flex items-start gap-4">
        <div
          className="size-20 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-base font-bold"
          style={{ background: `linear-gradient(135deg, ${team.color}33, ${team.color}11)` }}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={player.n} className="w-full h-full object-cover" />
          ) : (
            <span style={{ color: team.color }}>{team.short}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Badge variant="outline" style={{ borderColor: team.color }}>
              {team.short}
            </Badge>
            <span>{POSITION_LABELS[player.pos]}</span>
            {player.st !== undefined && player.st !== 0 && (
              <Badge variant="danger">Status {player.st}</Badge>
            )}
            {(player as { iotm?: boolean }).iotm && (
              <Badge variant="default">
                <ShoppingCart className="size-3 mr-1" /> Auf Markt
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold truncate">
            {player.fn ? `${player.fn} ` : ""}
            {player.n}
          </h1>
          <p className="text-sm text-muted-foreground">{team.name}</p>
        </div>
        <WatchButton playerId={playerId} initialWatched={watched} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Marktwert" value={formatEUR(player.mv, { compact: true })} sub={`${formatDelta(trend24)} (24h)`} subClass={trendColor} />
        <Kpi label="92-Tage-Trend" value={`${change92Pct > 0 ? "+" : ""}${change92Pct.toFixed(1)}%`} sub={formatDelta(change92)} subClass={change92 > 0 ? "text-emerald-400" : change92 < 0 ? "text-destructive" : "text-muted-foreground"} />
        <Kpi label="Punkte" value={player.p?.toLocaleString("de-DE") ?? "—"} />
        <Kpi label="Ø Punkte" value={player.ap?.toFixed(1) ?? "—"} />
      </div>

      {/* Market value chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            Marktwert · 92 Tage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {points.length < 2 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              Nicht genug Daten für einen Chart.
            </p>
          ) : (
            <>
              <MarketValueChart data={points} color="#10b981" />
              <div className="grid grid-cols-3 gap-3 mt-4 text-xs text-muted-foreground">
                <div>
                  <div className="text-foreground font-mono">
                    {mv92?.lmv ? formatEUR(mv92.lmv, { compact: true }) : "—"}
                  </div>
                  Tief 92T
                </div>
                <div>
                  <div className="text-foreground font-mono">
                    {mv92?.hmv ? formatEUR(mv92.hmv, { compact: true }) : "—"}
                  </div>
                  Hoch 92T
                </div>
                <div>
                  <div className={"font-mono " + trendColor}>
                    {trend24 ? formatDelta(trend24) : "0 €"}
                  </div>
                  Heute
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Performance per matchday */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!perf?.it || perf.it.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Performance-Daten.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="text-left font-medium py-2">Matchday</th>
                    <th className="text-right font-medium py-2">Punkte</th>
                  </tr>
                </thead>
                <tbody>
                  {perf.it.slice(0, 12).map((p, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="py-2 font-mono text-muted-foreground">
                        {p.d ?? p.date ?? `MD ${i + 1}`}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {p.p ?? p.pt ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  subClass,
}: {
  label: string;
  value: string;
  sub?: string;
  subClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-xl font-bold tracking-tight">{value}</div>
        {sub && <div className={`text-xs mt-0.5 ${subClass ?? "text-muted-foreground"}`}>{sub}</div>}
      </CardContent>
    </Card>
  );
}
