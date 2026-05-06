/**
 * News-Stream für einen einzelnen Spieler.
 *   GET /api/news/player/{playerId}?limit=20
 */

import { NextResponse } from "next/server";
import { getRecentNewsForPlayer } from "@/lib/news/store";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(50, limitParam))
    : 20;
  const items = await getRecentNewsForPlayer(id, { limit });
  return NextResponse.json({ items, count: items.length });
}
