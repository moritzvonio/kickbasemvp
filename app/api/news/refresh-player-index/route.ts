/**
 * Player-Index-Refresh.
 *
 * Authenticated-Endpoint: nimmt den User-Token aus der Session und
 * baut den Player-Index aus den Kickbase-Competition-Endpoints. Nötig
 * weil der Cron-Endpoint keinen Token hat.
 *
 * Lazy-Trigger: wird automatisch von der News-Page aufgerufen wenn
 * der Index leer/stale ist.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { rebuildPlayerIndex, getPlayerIndex, isIndexStale } from "@/lib/news/player-index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const idx = await rebuildPlayerIndex(session.token);
    return NextResponse.json({
      ok: true,
      count: idx.count,
      refreshedAt: idx.refreshedAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "refresh-failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const idx = await getPlayerIndex();
  return NextResponse.json({
    count: idx.count,
    refreshedAt: idx.refreshedAt,
    stale: isIndexStale(idx),
  });
}
