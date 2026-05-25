/**
 * News-Health-Endpoint für Diagnose.
 * Zeigt Backend-Mode, Item-Count, letzten Source-Status, Player-Index-Stand.
 *
 * GET /api/news/health
 */

import { NextResponse } from "next/server";
import {
  getRecentNews,
  getFetchStatus,
  NEWS_STORE_BACKEND,
} from "@/lib/news/store";
import { allSources } from "@/lib/news/sources";
import { getPlayerIndex, isIndexStale } from "@/lib/news/player-index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [recent, idx] = await Promise.all([
    getRecentNews({ limit: 1 }),
    getPlayerIndex(),
  ]);

  const sources = await Promise.all(
    allSources.map(async (s) => {
      const st = await getFetchStatus(s.id);
      return {
        id: s.id,
        type: s.type,
        clubSlug: s.clubSlug,
        intervalMinutes: s.intervalMinutes,
        lastFetch: st?.ts,
        lastStatus: st?.status,
        lastError: st?.err,
      };
    })
  );

  return NextResponse.json(
    {
      // BUILD-MARKER: ändert sich bei jedem Code-Push. Wenn dieser String
      // nach Deploy nicht aktuell ist, deployt Vercel deinen Push NICHT.
      buildMarker: "v6-2026-05-25-real-networth-chart",
      backend: NEWS_STORE_BACKEND,
      kvAvailable: !!process.env.KV_REST_API_URL,
      hasItems: recent.length > 0,
      newestPublishedAt: recent[0]?.publishedAt ?? null,
      newestSource: recent[0]?.sourceDisplayName ?? null,
      playerIndex: {
        count: idx.count,
        refreshedAt: idx.refreshedAt,
        stale: isIndexStale(idx),
      },
      sources,
      sourceCount: sources.length,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
