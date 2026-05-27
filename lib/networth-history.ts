/**
 * Netto-Teamwert-Verlauf seit Liga-Start — exakte Reconstruction.
 *
 * Methode (validiert: alle Manager landen am Liga-Start bei 150 ±2 Mio):
 *  - Kader zu jedem Sample-Datum = aktueller Kader, rückgerechnet über die
 *    Transfers DANACH (Käufe rückgängig = entfernen, Verkäufe = hinzufügen).
 *    Am „jetzt" exakt der echte Kader, am Start der Vor-Saison-Kader.
 *  - Teamwert(Datum) = Σ Marktwert(Kader, Datum) aus MV-History — exakt.
 *  - Cash(Datum) = Start(50M) + Transferbilanz(≤Datum) + Bonus×Zeitfortschritt.
 *    Endpunkte exakt (Start: 50M; jetzt: echtes/kalibriertes Cash); die
 *    Bonus-Verteilung dazwischen ist linear in der Zeit (gute Näherung, da
 *    Login täglich + Punkteprämie ~gleichmäßig anfallen).
 *  - Netto(Datum) = Teamwert + Cash.
 *
 * Conservation: Netto-Teamwert ist invariant gegenüber fairen Trades, daher
 * bleibt „150 am Start" auch bei Vorsaison-Transfers erhalten.
 */
import type { KbManagerSquadResponse, KbManagerTransfer, KbMarketValuePoint } from "./kickbase/types";

const DAY_MS = 86_400_000;

export interface NetWorthChartPoint {
  /** Achsen-Label, z.B. "01.08." */
  label: string;
  /** Absoluter Zeitstempel (ms) — für client-seitiges Zeitraum-Filtern */
  ms: number;
  /** Manager-Name → Netto-Teamwert (€) an diesem Datum */
  [manager: string]: number | string;
}

export interface ManagerHistoryInput {
  id: string;
  name: string;
  squad: KbManagerSquadResponse | null;
  transfers: KbManagerTransfer[];
  /** Aktuelles Cash (eigener User: exakt aus /me/budget; andere: kalibriert).
   *  Daraus + Post-Reset-Transferbilanz wird der Bonus-Anteil abgeleitet,
   *  damit der Endpunkt exakt das aktuelle Vermögen trifft. */
  currentCash: number;
}

function mvAtDay(pts: KbMarketValuePoint[], targetDay: number): number {
  if (!pts.length) return 0;
  let best: KbMarketValuePoint | null = null;
  for (const p of pts) if (p.dt <= targetDay && (!best || p.dt > best.dt)) best = p;
  return (best ?? pts[0]).mv;
}

function fmtLabel(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
}

export function buildNetWorthSeries(opts: {
  managers: ManagerHistoryInput[];
  mvHistories: Map<string, KbMarketValuePoint[]>;
  leagueStartMs: number;
  nowMs: number;
  initialBudget: number;
  /** Anzahl Stützpunkte (inkl. Start & jetzt). Default 64 (dicht genug zum
   *  Reinzoomen auf kurze Zeiträume client-seitig). */
  sampleCount?: number;
}): { data: NetWorthChartPoint[]; managers: { id: string; name: string }[] } {
  const { managers, mvHistories, leagueStartMs, nowMs, initialBudget } = opts;
  const n = Math.max(2, opts.sampleCount ?? 64);
  if (nowMs <= leagueStartMs) return { data: [], managers: [] };

  // Sample-Zeitpunkte linear von Start bis jetzt (inkl. beider Endpunkte)
  const sampleMs: number[] = [];
  for (let i = 0; i < n; i++) {
    sampleMs.push(Math.round(leagueStartMs + ((nowMs - leagueStartMs) * i) / (n - 1)));
  }
  const span = nowMs - leagueStartMs;

  // Pro Manager: Transfers vorbereiten.
  // WICHTIG: Zum Liga-Start werden Cash & Transfers zurückgesetzt — Transfers
  // VOR dem Liga-Start (Vorsaison/Reset) zählen NICHT. Sonst starten Manager
  // mit vielen Vorsaison-Trades fälschlich nicht bei ~150 Mio.
  const prepared = managers.map((m) => {
    const txs = (m.transfers ?? [])
      .map((t) => ({ ts: new Date(t.dt).getTime(), tty: t.tty, trp: t.trp ?? 0, pi: t.pi }))
      .filter((t) => !isNaN(t.ts) && t.ts > leagueStartMs);
    const currentOwned = new Map<string, number>();
    for (const p of m.squad?.it ?? []) currentOwned.set(p.pi, (currentOwned.get(p.pi) ?? 0) + 1);
    const transferNetNow = txs.reduce((s, t) => s + (t.tty === 2 ? t.trp : t.tty === 1 ? -t.trp : 0), 0);
    // Bonus bis jetzt = aktuelles Cash − Start − Post-Reset-Transferbilanz.
    // So trifft cash(jetzt) exakt currentCash und cash(start) exakt initialBudget.
    const totalBonus = m.currentCash - initialBudget - transferNetNow;
    return { m, txs, currentOwned, transferNetNow, totalBonus };
  });

  const data: NetWorthChartPoint[] = sampleMs.map((ms) => {
    const point: NetWorthChartPoint = { label: fmtLabel(ms), ms };
    const dayIdx = Math.floor(ms / DAY_MS);
    const progress = span > 0 ? Math.min(1, Math.max(0, (ms - leagueStartMs) / span)) : 1;

    for (const pm of prepared) {
      // Kader @ Datum: aktuellen Kader nehmen, Transfers NACH ms rückgängig machen
      const owned = new Map(pm.currentOwned);
      let transferNetUpTo = pm.transferNetNow;
      for (const t of pm.txs) {
        if (t.ts <= ms) continue; // dieser Transfer liegt VOR/AM Sample → bleibt drin
        // Transfer liegt NACH dem Sample → rückgängig
        if (t.tty === 1) {
          owned.set(t.pi, (owned.get(t.pi) ?? 0) - 1); // Kauf rückgängig → vorher nicht besessen
          transferNetUpTo += t.trp; // Kauf hatte Cash reduziert → zurückaddieren
        } else if (t.tty === 2) {
          owned.set(t.pi, (owned.get(t.pi) ?? 0) + 1); // Verkauf rückgängig → vorher besessen
          transferNetUpTo -= t.trp; // Verkauf hatte Cash erhöht → abziehen
        }
      }

      let teamValue = 0;
      for (const [pi, c] of owned) {
        if (c > 0) teamValue += mvAtDay(mvHistories.get(pi) ?? [], dayIdx) * c;
      }

      const cash = initialBudget + transferNetUpTo + pm.totalBonus * progress;
      point[pm.m.name] = Math.round(teamValue + cash);
    }
    return point;
  });

  return { data, managers: managers.map((m) => ({ id: m.id, name: m.name })) };
}
