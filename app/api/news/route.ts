/**
 * Public News-Stream API.
 *   GET /api/news?limit=50            → recent news (alle)
 *   GET /api/news?club=fcb&limit=50    → nach Verein gefiltert
 */

import { NextResponse } from "next/server";
import { getRecentNews, getRecentNewsForClub } from "@/lib/news/store";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(100, limitParam))
    : 50;
  const club = url.searchParams.get("club");

  const items = club
    ? await getRecentNewsForClub(club, { limit })
    : await getRecentNews({ limit });

  return NextResponse.json({ items, count: items.length });
}
