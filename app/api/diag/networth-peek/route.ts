/**
 * TEMP-DIAGNOSE — liest die gecachte Netto-Teamwert-Serie aus KV und gibt
 * Start/Jetzt pro Manager zurück. Schlüssel-geschützt (kein Login nötig),
 * damit ich die selbst-berechneten Werte ohne Session abrufen kann.
 * NACH DIAGNOSE LÖSCHEN.
 */
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "lb-diag-7x";

interface Series {
  data: Record<string, number | string>[];
  managers: { id: string; name: string }[];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const leagueId = url.searchParams.get("leagueId") ?? "6871934";
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `networth:series:v2:${leagueId}:${today}`;

  // Top-50-Pool-Diagnose (separat, unabhängig vom Networth-Cache)
  const top50 = await kv.get(`diag:top50:${leagueId}`).catch(() => null);

  let series: Series | null = null;
  try {
    series = await kv.get<Series>(cacheKey);
  } catch {
    /* */
  }
  if (!series || !series.data?.length) {
    return NextResponse.json({ error: "no networth cache yet", cacheKey, top50, hint: "Seite einmal öffnen, dann erneut" });
  }
  const first = series.data[0];
  const last = series.data[series.data.length - 1];
  const m = (v: unknown) => +(((Number(v) || 0) / 1e6).toFixed(1));
  const rows = series.managers
    .map((mgr) => ({ name: mgr.name, start: m(first[mgr.name]), now: m(last[mgr.name]) }))
    .sort((a, b) => a.start - b.start);
  return NextResponse.json({
    startLabel: first.label,
    nowLabel: last.label,
    points: series.data.length,
    top50,
    rows,
  });
}
