import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamTag } from "@/components/ui/team-tag";
import { PositionBadge } from "@/components/ui/position-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { PointBar, HotBadge } from "@/components/ui/point-bar";
import { formatEUR } from "@/lib/utils";
import { playerImageUrl, teamMeta, type KbCompetitionPlayer } from "@/lib/kickbase/types";
import { ArrowDown, ArrowUp, Minus, Clock, ShoppingCart, Goal, Footprints, Trophy } from "lucide-react";

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
  const compMap = new Map<string, KbCompetitionPlayer>();
  for (const p of compData.it ?? []) compMap.set(p.pi, p);

  // Compute per-position max points for bar normalization
  const maxByPos: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 1 };
  for (const cp of compData.it ?? []) {
    if (typeof cp.p === "number" && cp.p > (maxByPos[cp.pos] ?? 0)) maxByPos[cp.pos] = cp.p;
  }

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
        <div className="grid gap-2 slide-up slide-up-1">
          {sorted.map((p) => {
            const team = teamMeta(p.tid);
            const img = playerImageUrl(p.pim);
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
            const avg = meta?.ap;
            const goals = meta?.g ?? 0;
            const assists = meta?.a ?? 0;
            const max = maxByPos[p.pos] ?? 1;
            const pct = points > 0 ? points / max : 0;

            return (
              <Link
                key={p.i}
                href={`/league/${leagueId}/spieler/${p.i}`}
                className="card-hover block rounded-xl border border-border bg-card p-3.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-14 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold ring-1 ring-border"
                    style={{
                      background: `linear-gradient(135deg, ${team.color}22, ${team.color}08)`,
                    }}
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={p.n}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span style={{ color: team.color }}>{team.short}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{p.n}</span>
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
                      {p.u?.n && <span className="truncate">von {p.u.n}</span>}
                    </div>
                    {/* Points + bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <PointBar value={points} max={max} width={120} height={6} />
                      <span className="text-xs font-mono tabular font-semibold">
                        {points.toLocaleString("de-DE")}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular">
                        {avg !== undefined ? `Ø ${avg}` : "—"}
                      </span>
                      {goals > 0 && (
                        <span
                          className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5 tabular"
                          title={`${goals} Tore`}
                        >
                          <Goal className="size-3" />
                          {goals}
                        </span>
                      )}
                      {assists > 0 && (
                        <span
                          className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5 tabular"
                          title={`${assists} Vorlagen`}
                        >
                          <Footprints className="size-3" />
                          {assists}
                        </span>
                      )}
                    </div>
                  </div>

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
                      className={
                        "text-[10px] font-mono mt-0.5 font-semibold tabular " +
                        (priceDiff > 0
                          ? "text-amber-600"
                          : priceDiff < 0
                          ? "text-emerald-600"
                          : "text-muted-foreground")
                      }
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

      <p className="text-xs text-muted-foreground text-center pt-4">
        💡 Bar zeigt Punkte relativ zum besten Spieler seiner Position. 🔥 = Top 15 % auf seiner Position.
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
