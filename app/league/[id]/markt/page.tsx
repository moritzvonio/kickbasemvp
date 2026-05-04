import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamCrest, TeamTag } from "@/components/ui/team-tag";
import { PositionBadge } from "@/components/ui/position-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEUR } from "@/lib/utils";
import { playerImageUrl, teamMeta } from "@/lib/kickbase/types";
import { ArrowDown, ArrowUp, Minus, Clock, ShoppingCart } from "lucide-react";

export const metadata: Metadata = { title: "Transfermarkt" };
export const dynamic = "force-dynamic";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: leagueId } = await params;
  const path = `/league/${leagueId}/markt`;
  const session = await requireSessionOrRedirect(path);
  const data = await withKbAuth(path, () => kb.market(session.token, leagueId)).catch(
    () => ({ it: [] as Awaited<ReturnType<typeof kb.market>>["it"] })
  );
  const items = data.it ?? [];

  const sorted = items.slice().sort((a, b) => (b.mv ?? 0) - (a.mv ?? 0));

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
            : `${items.length} ${items.length === 1 ? "Angebot" : "Angebote"} in deiner Liga`}
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="slide-up slide-up-1">
          <EmptyState
            icon={<ShoppingCart className="size-6" />}
            title="Markt ist leer"
            description="Aktuell sind keine Spieler im Transfermarkt. Schau später nochmal vorbei oder check deine Watchlist."
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
            return (
              <Link
                key={p.i}
                href={`/league/${leagueId}/spieler/${p.i}`}
                className="card-hover block rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-12 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold ring-1 ring-border"
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
                    <div className="font-semibold truncate flex items-center gap-2">
                      {p.n}
                      {p.exs !== undefined && p.exs > 0 && (
                        <Badge variant="muted" className="text-[10px] gap-1">
                          <Clock className="size-3" />
                          {formatExpiry(p.exs)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5">
                      <TeamTag tid={p.tid} size="xs" />
                      <PositionBadge pos={p.pos} className="text-[9px] h-4 px-1" />
                      {p.u?.n && (
                        <span className="truncate">von {p.u.n}</span>
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
