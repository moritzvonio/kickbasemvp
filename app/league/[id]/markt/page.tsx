import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEUR, formatDelta } from "@/lib/utils";
import { POSITION_LABELS, playerImageUrl, teamMeta } from "@/lib/kickbase/types";
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
  const data = await withKbAuth(path, () => kb.market(session.token, leagueId)).catch(() => ({ it: [] }));
  const items = data.it ?? [];

  const sorted = items.slice().sort((a, b) => (b.mv ?? 0) - (a.mv ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingCart className="size-5" />
            </span>
            Transfermarkt
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} aktuelle Angebote in deiner Liga
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <ShoppingCart className="size-8 mx-auto mb-3 opacity-40" />
            Aktuell sind keine Spieler im Transfermarkt.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {sorted.map((p) => {
            const team = teamMeta(p.tid);
            const img = playerImageUrl(p.pim);
            const trend = p.mvt ?? 0;
            const TrendIcon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;
            const trendColor =
              trend > 0 ? "text-emerald-600" : trend < 0 ? "text-rose-600" : "text-muted-foreground";
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
                    style={{ background: `linear-gradient(135deg, ${team.color}22, ${team.color}08)` }}
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.n} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span style={{ color: team.color }}>{team.short}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate flex items-center gap-2">
                      {p.n}
                      {p.exs !== undefined && p.exs > 0 && (
                        <Badge variant="muted" className="text-[10px]">
                          <Clock className="size-3 mr-1" />
                          {formatExpiry(p.exs)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: `${team.color}1a`, color: team.color }}
                      >
                        {team.short}
                      </span>
                      <span>{POSITION_LABELS[p.pos]}</span>
                      {p.u?.n && (
                        <>
                          <span>·</span>
                          <span className="truncate">von {p.u.n}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold">{formatEUR(p.prc, { compact: true })}</div>
                    <div className="flex items-center justify-end gap-1.5 text-xs">
                      <span className="text-muted-foreground font-mono">
                        MV {formatEUR(p.mv, { compact: true })}
                      </span>
                      <span className={trendColor}>
                        <TrendIcon className="size-3 inline" />
                      </span>
                    </div>
                    <div
                      className={
                        "text-[10px] font-mono mt-0.5 " +
                        (priceDiff > 0 ? "text-amber-600" : priceDiff < 0 ? "text-emerald-600" : "text-muted-foreground")
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
