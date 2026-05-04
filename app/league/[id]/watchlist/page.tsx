import type { Metadata } from "next";
import Link from "next/link";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { getWatched } from "@/lib/watchlist";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEUR, formatDelta } from "@/lib/utils";
import { POSITION_LABELS, playerImageUrl, teamMeta } from "@/lib/kickbase/types";
import { ArrowDown, ArrowUp, Minus, Star } from "lucide-react";

export const metadata: Metadata = { title: "Watchlist" };
export const dynamic = "force-dynamic";

export default async function WatchlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: leagueId } = await params;
  const path = `/league/${leagueId}/watchlist`;
  const session = await requireSessionOrRedirect(path);
  const ids = await getWatched();

  const players = await Promise.all(
    ids.map((pid) =>
      withKbAuth(path, () => kb.player(session.token, leagueId, pid)).catch(() => null)
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <p className="text-sm text-muted-foreground">
          {ids.length} beobachtete Spieler
        </p>
      </div>

      {ids.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Star className="size-8 mx-auto mb-3 opacity-40" />
            Noch keine Spieler beobachtet. Öffne einen Spieler und tippe auf{" "}
            <span className="text-foreground font-medium">Beobachten</span>.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {players.map((p, idx) => {
            if (!p) {
              return (
                <Card key={ids[idx]}>
                  <CardContent className="py-3 text-sm text-muted-foreground">
                    Spieler {ids[idx]} konnte nicht geladen werden.
                  </CardContent>
                </Card>
              );
            }
            const team = teamMeta(p.tid);
            const img = playerImageUrl(p.pim);
            const trend24 = (p as { tfhmvt?: number }).tfhmvt ?? 0;
            const TrendIcon = trend24 > 0 ? ArrowUp : trend24 < 0 ? ArrowDown : Minus;
            const trendColor =
              trend24 > 0 ? "text-emerald-400" : trend24 < 0 ? "text-destructive" : "text-muted-foreground";
            return (
              <Link
                key={p.i}
                href={`/league/${leagueId}/spieler/${p.i}`}
                className="block rounded-lg border border-border bg-card hover:border-primary/40 transition-colors p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-12 rounded-md shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${team.color}33, ${team.color}11)` }}
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.n} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span style={{ color: team.color }}>{team.short}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate flex items-center gap-2">
                      {p.fn ? `${p.fn} ` : ""}
                      {p.n}
                      {(p as { iotm?: boolean }).iotm && (
                        <Badge variant="default" className="text-[10px]">Auf Markt</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{team.short}</span>
                      <span>·</span>
                      <span>{POSITION_LABELS[p.pos]}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{formatEUR(p.mv, { compact: true })}</div>
                    <div className={`text-xs flex items-center justify-end gap-0.5 ${trendColor}`}>
                      <TrendIcon className="size-3" />
                      <span className="font-mono">{trend24 ? formatDelta(trend24) : "0"}</span>
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
