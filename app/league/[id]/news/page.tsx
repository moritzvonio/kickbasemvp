import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { kb } from "@/lib/kickbase/api";
import { requireSessionOrRedirect, withKbAuth } from "@/lib/auth";
import { getRecentNews, NEWS_STORE_BACKEND } from "@/lib/news/store";
import {
  getPlayerIndex,
  isIndexStale,
  rebuildPlayerIndex,
} from "@/lib/news/player-index";
import { NewsStream } from "@/components/news/news-stream";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "News" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeagueNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: leagueId } = await params;
  const path = `/league/${leagueId}/news`;
  const session = await requireSessionOrRedirect(path);

  // Player-Index check — wenn stale, rebuild im Hintergrund (lazy)
  let idx = await getPlayerIndex();
  if (isIndexStale(idx)) {
    try {
      idx = await rebuildPlayerIndex(session.token);
    } catch {
      // ignore — leerer Index ist OK, taggt halt nichts
    }
  }

  const [squad, items] = await Promise.all([
    withKbAuth(path, () => kb.squad(session.token, leagueId)).catch(() => ({
      it: [],
    })),
    getRecentNews({ limit: 80 }),
  ]);

  const myPlayerIds = (squad.it ?? []).map((p) => p.i);

  const playerNameMap: Record<
    string,
    { name: string; pim?: string; tid?: string }
  > = {};
  for (const [pid, meta] of Object.entries(idx.byPlayerId)) {
    playerNameMap[pid] = { name: meta.name, pim: meta.pim, tid: meta.tid };
  }

  return (
    <div className="space-y-6">
      <div className="slide-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Newspaper className="size-5" />
          </span>
          News
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {items.length === 0
            ? NEWS_STORE_BACKEND === "memory"
              ? "Noch keine News — Cron läuft noch nicht oder KV-Store noch nicht aktiv."
              : "Quellen werden alle 30 Min eingelesen. Schau gleich nochmal vorbei."
            : `${items.length} News · Filter "Mein Team" zeigt nur Spieler aus deinem Kader.`}
        </p>
      </div>

      {idx.count === 0 && (
        <Card className="bg-amber-50/40 border-amber-200">
          <div className="p-3 text-xs text-amber-900">
            <strong>Hinweis:</strong> Spieler-Index noch nicht aufgebaut —
            Spielername-Tagging ist deaktiviert. Refreshe die Seite, das passiert
            automatisch.
          </div>
        </Card>
      )}

      <NewsStream
        initialItems={items}
        myPlayerIds={myPlayerIds}
        playerNameMap={playerNameMap}
        leagueId={leagueId}
      />
    </div>
  );
}
