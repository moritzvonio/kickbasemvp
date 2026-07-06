/**
 * Marktwert-Prognose mit robuster Pattern-Analyse.
 *
 * Inputs: idealerweise 60+ Tage MV-History (mehr Samples pro Wochentag).
 *
 * Ansatz:
 *   1) Wochentag-Effekt aus ALLER History – pro DoW Median-Δ (Outlier-resistent)
 *   2) Recent Trend aus den letzten 14 Tagen (linear regression)
 *   3) Mean-Reversion zu 30d-Mittel (stärker bei großer Abweichung)
 *   4) Volatility-adjusted Gewichte: bei hoher Vola dominiert Reversion;
 *      bei stabilen Werten dominiert Trend.
 *   5) Konfidenz aus relativer Standard-Abweichung & Anzahl History-Tage
 */

export interface MvPoint {
  dt: number;
  mv: number;
}

export interface MvPrediction {
  next1d: number;
  delta1d: number;
  delta1dPct: number;
  delta3d: number;
  daysUntilMatchday: number;
  deltaUntilMatchday: number;
  mvAtMatchday: number;
  /** Konfidenz 0-1 */
  confidence: number;
  /** Anzahl History-Tage die in die Prognose flossen */
  historyDays: number;
}

/**
 * Saisonweiten Wochentag-Pattern aus mehreren Spieler-Histories berechnen.
 * Pro Wochentag: Median der täglichen %-Δ über ALLE Spieler.
 *
 * Ergebnis: number[7] (0=So, 1=Mo, ..., 6=Sa) mit Median-%-Δ als Dezimal
 * (z.B. 0.005 = +0.5%). Wochentage mit < 20 Samples → 0 (zu wenig Signal).
 */
export function computeGlobalDowPct(histories: MvPoint[][]): number[] {
  const pctByDow: number[][] = Array.from({ length: 7 }, () => []);
  for (const h of histories) {
    if (h.length < 7) continue;
    const sorted = h.slice().sort((a, b) => a.dt - b.dt);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].mv;
      if (prev <= 0) continue;
      const pct = (sorted[i].mv - prev) / prev;
      // Filter: extreme Outlier (>15% pro Tag) ignorieren – meist Datenfehler
      if (Math.abs(pct) > 0.15) continue;
      const dow = dowFromDt(sorted[i].dt);
      pctByDow[dow].push(pct);
    }
  }
  return pctByDow.map((arr) => (arr.length >= 20 ? trimmedMean(arr, 0.05) : 0));
}

/** Konfidenz für globalen DoW-Pattern: anzahl-basiert */
export function dowPatternSampleCounts(histories: MvPoint[][]): number[] {
  const counts: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const h of histories) {
    if (h.length < 7) continue;
    const sorted = h.slice().sort((a, b) => a.dt - b.dt);
    for (let i = 1; i < sorted.length; i++) {
      const dow = dowFromDt(sorted[i].dt);
      counts[dow]++;
    }
  }
  return counts;
}

/** UTC-Wochentag aus dt-Zahl. 1970-01-01 war Donnerstag = 4. */
function dowFromDt(dt: number): number {
  return ((dt % 7) + 4 + 7) % 7;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

/**
 * Trimmed mean – sortiert, schneidet oben + unten je `trimPct` weg, mittelt
 * den Rest. Gut für leicht-rauschige Daten mit gelegentlichen Outliern.
 * Anders als Median zeigt dies auch kleine systematische Verschiebungen
 * an, wenn die Mehrzahl der Werte 0 ist (typisch für tägliche MV-Δs).
 */
function trimmedMean(arr: number[], trimPct = 0.05): number {
  if (arr.length === 0) return 0;
  const s = arr.slice().sort((a, b) => a - b);
  const trim = Math.floor(s.length * trimPct);
  const inner = s.slice(trim, s.length - trim);
  if (inner.length === 0) return 0;
  return inner.reduce((sum, v) => sum + v, 0) / inner.length;
}

/** Tage bis zum nächsten Bundesliga-Spieltag-Anpfiff (Fr 20:30). */
export function daysUntilNextMatchday(now: Date = new Date()): number {
  const FRIDAY = 5;
  const dow = now.getDay();
  let diff = (FRIDAY - dow + 7) % 7;
  if (diff === 0) {
    const passedKickoff =
      now.getHours() > 20 || (now.getHours() === 20 && now.getMinutes() >= 30);
    if (passedKickoff) diff = 7;
  }
  return diff;
}

export function predictMv(
  history: MvPoint[],
  opts?: { globalDowPct?: number[] }
): MvPrediction | null {
  if (history.length < 7) return null;

  const sorted = history.slice().sort((a, b) => a.dt - b.dt);
  const last = sorted[sorted.length - 1];
  const historyDays = sorted.length;

  // ─── 1) Tägliche Δ über ALLE History sammeln, pro Wochentag gruppieren ───
  const deltasByDow: number[][] = Array.from({ length: 7 }, () => []);
  const allDeltas: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const delta = sorted[i].mv - sorted[i - 1].mv;
    const dow = dowFromDt(sorted[i].dt);
    deltasByDow[dow].push(delta);
    allDeltas.push(delta);
  }

  // Median-Δ pro Wochentag (robuster als Mean gegen Ausreißer wie
  // Spieltagspunkte-Sprünge). Wochentage mit <3 Samples → 0 (zu wenig Signal).
  const medianByDow = deltasByDow.map((arr) =>
    arr.length >= 3 ? median(arr) : 0
  );

  // ─── 2) Multi-Window-Trend ───
  // Hot-Phasen werden vom 14-Tage-Trend zu spät erfasst. Wir mischen
  // 3 Zeitfenster + den gestrigen Δ als Momentum-Komponente.
  const linearSlope = (window: MvPoint[]): number => {
    const n = window.length;
    if (n < 3) return 0;
    const xMean = window.reduce((s, p) => s + p.dt, 0) / n;
    const yMean = window.reduce((s, p) => s + p.mv, 0) / n;
    let num = 0;
    let den = 0;
    for (const p of window) {
      num += (p.dt - xMean) * (p.mv - yMean);
      den += (p.dt - xMean) ** 2;
    }
    return den > 0 ? num / den : 0;
  };
  const slope5 = linearSlope(sorted.slice(-5));
  const slope14 = linearSlope(sorted.slice(-14));
  const slope30 = linearSlope(sorted.slice(-30));
  const yesterdayDelta =
    sorted.length >= 2
      ? sorted[sorted.length - 1].mv - sorted[sorted.length - 2].mv
      : 0;
  // Gewichteter Mix: kurzes Fenster dominiert (Hot-Phase erkennen),
  // 14d gibt Stabilität, 30d Anker, gestern-Δ Momentum-Boost.
  const slope =
    0.4 * slope5 + 0.35 * slope14 + 0.1 * slope30 + 0.15 * yesterdayDelta;

  // ─── 3) Mean-Reversion zu 30d-Mittel ───
  const last30 = sorted.slice(-30);
  const mean30 = last30.reduce((s, p) => s + p.mv, 0) / last30.length;
  const deviationFromMean = last.mv - mean30;
  // Stärker zurückziehen bei großer Abweichung (>5% vom Mittel)
  const relDeviation = mean30 > 0 ? deviationFromMean / mean30 : 0;
  const reversionStrength = Math.min(0.3, Math.abs(relDeviation) * 2);
  const reversionPerDay = -deviationFromMean * (reversionStrength / 7);

  // ─── 4) Volatility ───
  const meanAllDelta =
    allDeltas.reduce((s, v) => s + v, 0) / Math.max(1, allDeltas.length);
  const variance =
    allDeltas.length > 1
      ? allDeltas.reduce((s, v) => s + (v - meanAllDelta) ** 2, 0) /
        (allDeltas.length - 1)
      : 0;
  const stddev = Math.sqrt(variance);
  const relStddev = last.mv > 0 ? stddev / last.mv : 1;

  // Konfidenz aus Volatilität (relativ zum MV) + Historie-Länge.
  // Skala kalibriert auf typische Markt-Spieler:
  //   relStd 0.005 (sehr stabil)  → ~0.8
  //   relStd 0.012 (normal)       → ~0.5
  //   relStd 0.025 (volatil)      → ~0.0
  const confidence = Math.max(
    0,
    Math.min(1, 1 - relStddev * 40) * Math.min(1, historyDays / 30)
  );

  // Feste Gewichte. Vola ging vorher ins wTrend-Sinken – das ist falsch:
  // ein Hot-Spieler hat hohe Vola (große positive Δ) und hat genau den
  // Trend den wir EINFANGEN wollen. Stattdessen nutzen wir Vola nur für
  // Konfidenz (Anzeige), nicht für Gewichtung.
  const wDow = 0.3; // Wochentag-Variation (relativ)
  const wTrend = 0.55; // Multi-Window-Trend dominiert
  const wReversion = 0.15; // sanfte Mean-Reversion

  // ─── 5) Multi-Tag-Prognose ───
  // DoW-Komponente: extrahiere nur die WOCHENTAG-VARIATION aus dem globalen
  // Pattern (absoluten Niveaushift entfernen, da der Saisonende-/Selection-
  // Bias enthält). Der absolute Trend kommt vom persönlichen `slope`.
  // Beispiel-Pattern -0.19/-0.19/-0.27/-0.38/-0.60/-0.50/-0.38 mit Mean -0.36:
  //   relativ = +0.17/+0.17/+0.09/-0.02/-0.24/-0.14/-0.02
  //   → Mo/Di leicht positiv, Fr deutlich negativ – wie erwartet.
  const useGlobal = opts?.globalDowPct;
  const dowMean =
    useGlobal && useGlobal.length === 7
      ? useGlobal.reduce((s, v) => s + v, 0) / 7
      : 0;
  const relativeDowPct = useGlobal
    ? useGlobal.map((p) => p - dowMean)
    : null;

  const sumNextDays = (n: number): number => {
    if (n <= 0) return 0;
    let sum = 0;
    let runningMv = last.mv;
    for (let d = 1; d <= n; d++) {
      const futureDt = last.dt + d;
      const futureDow = dowFromDt(futureDt);
      const dowComp = relativeDowPct
        ? relativeDowPct[futureDow] * runningMv // nur Wochentag-Abweichung × MV
        : medianByDow[futureDow];
      const runningDeviation = runningMv - mean30;
      const dailyReversion = -runningDeviation * (reversionStrength / 7);

      const dayDelta =
        dowComp * wDow + slope * wTrend + dailyReversion * wReversion;
      sum += dayDelta;
      runningMv += dayDelta;
    }
    return sum;
  };

  const delta1d = sumNextDays(1);
  const delta3d = sumNextDays(3);
  const daysUntilMatchday = daysUntilNextMatchday();
  const deltaUntilMatchday = sumNextDays(daysUntilMatchday);

  const next1d = last.mv + delta1d;
  const delta1dPct = last.mv > 0 ? (delta1d / last.mv) * 100 : 0;
  const mvAtMatchday = last.mv + deltaUntilMatchday;

  return {
    next1d,
    delta1d,
    delta1dPct,
    delta3d,
    daysUntilMatchday,
    deltaUntilMatchday,
    mvAtMatchday,
    confidence,
    historyDays,
  };
}
