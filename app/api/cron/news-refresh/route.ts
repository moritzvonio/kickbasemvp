/**
 * Cron-Endpoint, getriggert von GitHub Actions alle 30 Min.
 * Header: Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from "next/server";
import { refreshAllSources } from "@/lib/news/aggregator";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function handle(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET_NOT_CONFIGURED" },
      { status: 503 }
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await refreshAllSources();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
