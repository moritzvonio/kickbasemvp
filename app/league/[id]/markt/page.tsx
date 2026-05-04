import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamTag } from "@/components/ui/team-tag";
import { PositionBadge } from "@/components/ui/position-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { PointBar, BatteryBar, HotBadge } from "@/components/ui/point-bar";
import { RankBadge, RankNumber } from "@/components/ui/rank-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatEUR, cn } from "@/lib/utils";
import { type KbCompetitionPlayer } from "@/lib/kickbase/types";
import {
  ArrowDown,
  ArrowUp,
  Minus,
  Clock,
  ShoppingCart,
  Goal,
  Footprints,
} from "lucide-react";

export const metadata: Metadata = { title: "Transfermarkt" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: leagueId } = await params;
  const path = `/league/${leagueId}/markt`;
  const session = await requireSessionOrRedirect(path);

  const [marketData, compData] = await Promise.all([
    withKbAuth(path, () => kb.market(session.token, leagueId)).catch(
      () => ({ it: [] as Awaited<ReturnType<typeof kb.market>>["it"] })
    ),
    withKbAuth(path, () => kb.competitionPlayers(session.token, "1")).catch(
      () => ({ it: [] as KbCompetitionPlayer[] })
    ),
  ]);

  const items = marketData.it ?? [];
  const allComp = (compData.it ?? []).slice();

  // Build ranking maps:
  //   rankByPid       → 1-N across all Bundesliga players (overall)
  //   rankByPidPos    → 1-N within position
  //   maxByPos        → max points per position (for PointBar normalization)
  //   maxAvgByPos     → max ap per position (for Ø-bar normalization)
  const allSorted = allComp.slice().sort((a, b) => (b.p ?? 0) - (a.p ?? 0));
  const rankByPid = new Map<string, number>();
  allSorted.forEach((cp, i) => rankByPid.set(cp.pi, i + 1));

  const rankByPidPos = new Map<string, number>();
  const sortedByPos: Record<number, KbCompetitionPlayer[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const cp of allComp) sortedByPos[cp.pos]?.push(cp);
  for (const list of Object.values(sortedByPos)) {
    list.sort((a, b) => (b.p ?? 0) - (a.p ?? 0));
    list.forEach((cp, i) => rankByPidPos.set(cp.pi, i + 1));
  }

  const maxByPos: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 1 };
  const maxAvgByPos: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 1 };
  for (const cp of allComp) {
    if (typeof cp.p === "number" && cp.p > (maxByPos[cp.pos] ?? 0)) maxByPos[cp.pos] = cp.p;
    if (typeof cp.ap === "number" && cp.ap > (maxAvgByPos[cp.pos] ?? 0)) maxAvgByPos[cp.pos] = cp.ap;
  }

  const compMap = new Map<string, KbCompetitionPlayer>();
  for (const p of allComp) compMap.set(p.pi, p);

  const sorted = items.slice().sort((a, b) => {
    const pa = compMap.get(a.i)?.p ?? 0;
    const pb = compMap.get(b.i)?.p ?? 0;
    return pb - pa;
  });

  return (
    <div className="space-y-6">
      <div className="slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <ShoppingCart className="size-5" />
          </span>
          Transfermarkt
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {items.length === 0
            ? "Aktuell keine Angebote"
            : `${items.length} ${items.length === 1 ? "Angebot" : "Angebote"} · sortiert nach Saison-Punkten`}
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="slide-up slide-up-1">
          <EmptyState
            icon={<ShoppingCart className="size-6" />}
            title="Markt ist leer"
            description="Aktuell sind keine Spieler im Transfermarkt. Schau später nochmal vorbei."
          />
        </Card>
      ) : (
        <div className="grid gap-2.5 slide-up slide-up-1">
          {sorted.map((p) => {
            const trend = p.mvt ?? 0;
            const TrendIcon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;
            const trendColor =
              trend > 0
                ? "text-emerald-600"
                : trend < 0
                ? "text-rose-600"
                : "text-muted-foreground";
            const priceDiff = p.prc - p.mv;
            const priceDiffPct = p.mv > 0 ? (priceDiff / p.mv) * 100 : 0;

            const meta = compMap.get(p.i);
            const points = meta?.p ?? 0;
            const avg = meta?.ap ?? 0;
            const goals = meta?.g ?? 0;
            const assists = meta?.a ?? 0;
            const max = maxByPos[p.pos] ?? 1;
            const maxAvg = maxAvgByPos[p.pos] ?? 1;
            const pct = points > 0 ? points / max : 0;
            const overallRank = rankByPid.get(p.i);
            const posRank = rankByPidPos.get(p.i);

            return (
              <Link
                key={p.i}
                href={`/league/${leagueId}/spieler/${p.i}`}
                className="card-hover block rounded-xl border border-border bg-card p-3.5"
              >
                <div className="flex items-start gap-3">
                  <PlayerAvatar pim={p.pim} tid={p.tid} size={64} />

                  {/* Center column: name + tags + stats grid */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{p.n}</span>
                      <RankBadge rank={overallRank} />
                      <HotBadge pct={pct} />
                      {p.exs !== undefined && p.exs > 0 && (
                        <Badge variant="muted" className="text-[10px] gap-1">
                          <Clock className="size-3" />
                          {formatExpiry(p.exs)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <TeamTag tid={p.tid} size="xs" />
                      <PositionBadge pos={p.pos} className="text-[9px] h-4 px-1" />
                      {posRank && <RankNumber rank={posRank} />}
                      {p.u?.n && <span className="truncate">von {p.u.n}</span>}
                    </div>

                    {/* Battery + numbers row */}
                    <div className="flex items-center gap-3 pt-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <BatteryBar value={avg} max={maxAvg} width={120} height={18} />
                        <div className="flex flex-col leading-tight">
                          <span className="text-base font-bold tabular leading-none">
                            {avg > 0 ? avg : "—"}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium leading-none mt-0.5">
                            Ø Spieltag
                          </span>
                        </div>
                      </div>
                      <div className="h-6 w-px bg-border/60 hidden sm:block" />
                      <div className="flex flex-col leading-tight hidden sm:flex">
                        <span className="text-sm font-mono font-semibold tabular leading-none text-muted-foreground">
                          {points.toLocaleString("de-DE")}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium leading-none mt-0.5">
                          Saison
                        </span>
                      </div>
                    </div>

                    {/* Mobile-only Saison-Total + Goals/Assists */}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap sm:hidden">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted tabular font-mono">
                        {points.toLocaleString("de-DE")} P Saison
                      </span>
                    </div>

                    {/* Goals + assists pill */}
                    {(goals > 0 || assists > 0) && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {goals > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted tabular">
                            <Goal className="size-3" />
                            {goals} {goals === 1 ? "Tor" : "Tore"}
                          </span>
                        )}
                        {assists > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted tabular">
                            <Footprints className="size-3" />
                            {assists} {assists === 1 ? "Vorlage" : "Vorlagen"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right column: Preis */}
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-base tabular">
                      {formatEUR(p.prc, { compact: true })}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-xs">
                      <span className="text-muted-foreground font-mono tabular">
                        MV {formatEUR(p.mv, { compact: true })}
                      </span>
                      <span className={trendColor}>
                        <TrendIcon className="size-3 inline" />
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-[10px] font-mono mt-0.5 font-semibold tabular",
                        priceDiff > 0
                          ? "text-amber-600"
                          : priceDiff < 0
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      )}
                    >
                      {priceDiff > 0 ? "+" : ""}
                      {priceDiffPct.toFixed(0)}% vs MV
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-4 leading-relaxed">
        💡 Batterie zeigt den Ø-Saisonpunkt-Stand relativ zum besten Spieler der Position.
        <br />
        💎 <span className="font-semibold">TOP 5</span> Diamant ·{" "}
        🥇 <span className="font-semibold">TOP 25</span> Gold ·{" "}
        🥈 <span className="font-semibold">TOP 50</span> Silber ·{" "}
        🥉 <span className="font-semibold">TOP 100</span> Bronze
      </p>
    </div>
  );
}

function formatExpiry(seconds: number): string {
  if (seconds <= 0) return "abgelaufen";
  const hours = Math.floor(seconds / 3600);
  if (hours < 1) return `${Math.floor(seconds / 60)}m`;
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
