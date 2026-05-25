/**
 * TEMP-DIAGNOSE — wann startete die Liga + ab wann sind MV-Daten verlässlich?
 * Außerdem: liefert /overview die echten Budgets (b) ALLER Manager?
 *
 * GET /api/diag/league-start?leagueId=XXXX
 * NACH DIAGNOSE LÖSCHEN.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { kb } from "@/lib/kickbase/api";
import type { KbMarketValuePoint } from "@/lib/kickbase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const M = (n: number) => +(n / 1_000_000).toFixed(1);
const DAY_MS = 86_400_000;

function mvAtDay(points: KbMarketValuePoint[], targetDay: number): number | null {
  if (!points.length) return null;
  let best: KbMarketValuePoint | null = null;
  for (const p of points) if (p.dt <= targetDay && (!best || p.dt > best.dt)) best = p;
  return (best ?? points[0]).mv;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
    })
  );
  return out;
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const leagueId = new URL(req.url).searchParams.get("leagueId");
  if (!leagueId) return NextResponse.json({ error: "leagueId required" }, { status: 400 });

  const [overview, ranking] = await Promise.all([
    kb.leagueOverviewWithManagers(s.token, leagueId).catch(() => null),
    kb.ranking(s.token, leagueId).catch(() => null),
  ]);

  // Overview: alle top-level keys + Datums-verdächtige Felder + Manager-Budgets
  const ov = (overview ?? {}) as Record<string, unknown>;
  const dateLikeKeys: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ov)) {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) dateLikeKeys[k] = v;
    if (/date|created|start|cd|sd|founded/i.test(k)) dateLikeKeys[k] = v;
  }
  const ms = (ov.ms ?? ov.us ?? []) as Array<Record<string, unknown>>;
  const managerBudgets = ms.slice(0, 12).map((m) => ({
    n: m.n, b: typeof m.b === "number" ? M(m.b) : m.b, tv: typeof m.tv === "number" ? M(m.tv) : m.tv,
  }));

  const members = (ranking?.us ?? ranking?.it ?? []).map((u) => ({ i: u.i, n: u.n }));

  // Reconstruction (wie networth-start)
  const perManager = await mapLimit(members, 4, async (m) => {
    const [squad, transfers] = await Promise.all([
      kb.managerSquad(s.token, leagueId, m.i).catch(() => null),
      kb.managerTransferAll(s.token, leagueId, m.i).catch(() => []),
    ]);
    return { m, squad, transfers };
  });

  const distinct = new Set<string>();
  const recon = perManager.map((pm) => {
    const owned = new Map<string, number>();
    for (const p of pm.squad?.it ?? []) owned.set(p.pi, (owned.get(p.pi) ?? 0) + 1);
    const txs = [...pm.transfers].sort((a, b) => new Date(b.dt).getTime() - new Date(a.dt).getTime());
    for (const t of txs) {
      const c = owned.get(t.pi) ?? 0;
      if (t.tty === 1) owned.set(t.pi, c - 1);
      else if (t.tty === 2) owned.set(t.pi, c + 1);
    }
    const startSquad = [...owned.entries()].filter(([, c]) => c > 0).map(([pi]) => pi);
    startSquad.forEach((pi) => distinct.add(pi));
    return { m: pm.m, startSquad };
  });

  const playerIds = [...distinct];
  const hist = new Map<string, KbMarketValuePoint[]>();
  await mapLimit(playerIds, 16, async (pid) => {
    const h = await kb.marketValue(s.token, leagueId, pid, 400).catch(() => null);
    hist.set(pid, h?.it ?? []);
  });

  // Ab wann beginnen MV-Daten? (frühester dt über alle Start-Spieler)
  let firstDataDay = Infinity, lastDataDay = -Infinity;
  for (const pts of hist.values()) {
    for (const p of pts) { firstDataDay = Math.min(firstDataDay, p.dt); lastDataDay = Math.max(lastDataDay, p.dt); }
  }
  const firstDataDate = isFinite(firstDataDay) ? new Date(firstDataDay * DAY_MS).toISOString().slice(0, 10) : null;

  // Feinraster-Probe: avg/min/max/Streuung pro Datum
  const probe = ["2025-07-11","2025-07-15","2025-07-18","2025-07-22","2025-07-25","2025-07-29","2025-08-01","2025-08-05","2025-08-08"];
  const perDate = probe.map((ds) => {
    const day = Math.floor(new Date(ds).getTime() / DAY_MS);
    const nets = recon.map((r) => {
      let mv = 0;
      for (const pi of r.startSquad) { const v = mvAtDay(hist.get(pi) ?? [], day); if (v != null) mv += v; }
      return M(50_000_000 + mv);
    });
    const avg = +(nets.reduce((a, b) => a + b, 0) / nets.length).toFixed(1);
    return { date: ds, min: Math.min(...nets), max: Math.max(...nets), spread: +(Math.max(...nets) - Math.min(...nets)).toFixed(1), avg };
  });

  return NextResponse.json(
    {
      overview: { dateLikeKeys, topLevelKeys: Object.keys(ov), managerBudgets },
      mvData: { firstDataDate, distinctStartPlayers: playerIds.length },
      earliestTransfer: (() => {
        let e = Infinity;
        for (const pm of perManager) for (const t of pm.transfers) { const ts = new Date(t.dt).getTime(); if (!isNaN(ts)) e = Math.min(e, ts); }
        return isFinite(e) ? new Date(e).toISOString().slice(0, 10) : null;
      })(),
      probe: perDate,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
