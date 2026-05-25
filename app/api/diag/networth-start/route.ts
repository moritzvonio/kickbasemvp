/**
 * TEMP-DIAGNOSE — Netto-Teamwert bei SAISONSTART pro Manager.
 * Backtest: muss für alle ~150 Mio sein (50 Cash + ~100 Teamwert).
 *
 * Methode (EXAKT, keine Schätzung):
 *  - Aktueller Kader (managerSquad) + vollständige Transfer-History.
 *  - Reverse-Replay der Transfers (neueste→älteste) → Kader bei Saisonstart.
 *  - Marktwert jedes Startkader-Spielers am Start-Datum aus MV-History.
 *  - Netto bei Start = 50 Mio Cash + Σ Start-Marktwerte (Boni/Trades = 0).
 *
 * GET /api/diag/networth-start?leagueId=XXXX
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

/** Marktwert am Ziel-Tag (days-since-epoch) — letzter Punkt ≤ Ziel, sonst erster. */
function mvAtDay(points: KbMarketValuePoint[], targetDay: number): number | null {
  if (!points.length) return null;
  let best: KbMarketValuePoint | null = null;
  for (const p of points) {
    if (p.dt <= targetDay && (!best || p.dt > best.dt)) best = p;
  }
  return (best ?? points[0]).mv;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const leagueId = new URL(req.url).searchParams.get("leagueId");
  if (!leagueId)
    return NextResponse.json({ error: "leagueId required" }, { status: 400 });

  const ranking = await kb.ranking(s.token, leagueId).catch(() => null);
  const members = (ranking?.us ?? ranking?.it ?? []).map((u) => ({ i: u.i, n: u.n }));
  if (!members.length)
    return NextResponse.json({ error: "no members" }, { status: 500 });

  // Pro Manager: aktueller Kader + alle Transfers
  const perManager = await mapLimit(members, 4, async (m) => {
    const [squad, transfers] = await Promise.all([
      kb.managerSquad(s.token, leagueId, m.i).catch(() => null),
      kb.managerTransferAll(s.token, leagueId, m.i).catch(() => []),
    ]);
    return { m, squad, transfers };
  });

  // Globales Start-Datum = früheste Transaktion aller Manager (≈ Liga-Start)
  let earliestMs = Infinity;
  for (const pm of perManager) {
    for (const t of pm.transfers) {
      const ts = new Date(t.dt).getTime();
      if (!isNaN(ts)) earliestMs = Math.min(earliestMs, ts);
    }
  }
  // Startkader pro Manager via Reverse-Replay rekonstruieren
  const distinctPlayers = new Set<string>();
  const reconstructed = perManager.map((pm) => {
    const owned = new Map<string, number>(); // pi → count
    for (const p of pm.squad?.it ?? []) owned.set(p.pi, (owned.get(p.pi) ?? 0) + 1);
    // neueste → älteste
    const txs = [...pm.transfers].sort(
      (a, b) => new Date(b.dt).getTime() - new Date(a.dt).getTime()
    );
    for (const t of txs) {
      const c = owned.get(t.pi) ?? 0;
      if (t.tty === 1) owned.set(t.pi, c - 1); // Kauf rückgängig → vorher nicht besessen
      else if (t.tty === 2) owned.set(t.pi, c + 1); // Verkauf rückgängig → vorher besessen
    }
    const startSquad = [...owned.entries()].filter(([, c]) => c > 0).map(([pi]) => pi);
    startSquad.forEach((pi) => distinctPlayers.add(pi));
    const currentTeamMV = (pm.squad?.it ?? []).reduce((acc, p) => acc + (p.mv ?? 0), 0);
    return { m: pm.m, startSquad, currentTeamMV, currentSize: pm.squad?.it?.length ?? 0 };
  });
  const playerIds = [...distinctPlayers];

  // MV-History pro distinct Startkader-Spieler (dedupliziert, begrenzte Parallelität).
  // An mehreren
  // Kandidaten-Daten — um zu sehen, welcher Anker ~150 Mio liefert.
  const candidateDates = [
    "2025-07-11", "2025-07-25", "2025-08-08", "2025-08-15", "2025-08-22", "2025-09-01",
  ];
  const histByPlayer = new Map<string, KbMarketValuePoint[]>();
  await mapLimit(playerIds, 16, async (pid) => {
    const hist = await kb.marketValue(s.token, leagueId, pid, 365).catch(() => null);
    histByPlayer.set(pid, hist?.it ?? []);
  });

  // Pro Kandidaten-Datum: Netto-Verteilung über alle Manager
  const perDate = candidateDates.map((ds) => {
    const day = Math.floor(new Date(ds).getTime() / DAY_MS);
    const nets = reconstructed.map((r) => {
      let mv = 0;
      for (const pi of r.startSquad) {
        const v = mvAtDay(histByPlayer.get(pi) ?? [], day);
        if (v != null) mv += v;
      }
      return 50_000_000 + mv;
    });
    const arr = nets.map((n) => M(n));
    const avg = +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
    return { date: ds, min: Math.min(...arr), max: Math.max(...arr), avg };
  });

  // Detail-Tabelle am besten passenden Anker (2 Wochen vor MD1 ≈ 2025-08-08)
  const detailDay = Math.floor(new Date("2025-08-08").getTime() / DAY_MS);
  const rows = reconstructed
    .map((r) => {
      let mv = 0;
      for (const pi of r.startSquad) {
        const v = mvAtDay(histByPlayer.get(pi) ?? [], detailDay);
        if (v != null) mv += v;
      }
      return {
        manager: r.m.n,
        startSquadSize: r.startSquad.length,
        startTeamMV_Mio: M(mv),
        netWorthStart_Mio: M(50_000_000 + mv),
        currentTeamMV_Mio: M(r.currentTeamMV),
      };
    })
    .sort((a, b) => b.netWorthStart_Mio - a.netWorthStart_Mio);

  return NextResponse.json(
    {
      earliestTransfer: new Date(earliestMs).toISOString().slice(0, 10),
      distinctStartPlayers: playerIds.length,
      perDate,
      detailDate: "2025-08-08",
      rows,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
