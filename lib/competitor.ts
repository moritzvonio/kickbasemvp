/**
 * Competitor Analysis — back-computes per-manager cash from observable signals.
 *
 * Cash-Berechnung:
 *   cash = initialBudget
 *        - Σ(buy.trp)            // every buy reduces cash
 *        + Σ(sell.trp)            // every sell adds cash
 *        + Σ(bonus.bn)            // matchday bonuses & achievements
 *
 * Initial budget = league.b (Liga-Setting, default 50 Mio in Bundesliga,
 * sometimes 30 Mio for "small" leagues).
 *
 * 33%-Regel (Verkauf an Liga-Bank):
 *   Wenn ein Spieler an die Liga (statt an einen Manager) verkauft wird,
 *   gibt es nur 67% des aktuellen Marktwerts. Daher liquidation_value =
 *   Σ(player.mv * 0.67).
 *
 * Max-Bid:
 *   - "single": cash + 0.67 * mv des teuersten Bench-Spielers
 *               (typischer Realfall: einen Spieler verkaufen für mehr Cash)
 *   - "total":  cash + Σ(0.67 * mv aller Squad-Spieler) — theoretischer Max
 */

import type {
  KbActivity,
  KbManagerSquadResponse,
  KbManagerTransfer,
  KbRankingUser,
} from "./kickbase/types";

export const SELL_TO_BANK_FACTOR = 0.67;

export interface ManagerComputedStats {
  userId: string;
  name: string;
  image?: string;
  initialBudget: number;
  /** Σ Kaufsummen */
  totalBought: number;
  /** Σ Verkaufssummen */
  totalSold: number;
  /** Σ Bonus-Auszahlungen (Spieltag + Achievements) */
  totalBonus: number;
  /** Berechneter aktueller Cash-Stand */
  cashEstimate: number;
  /** Nettoergebnis aus allen Transfers (Sells - Buys) */
  transferBalance: number;
  /** Anzahl Transfers */
  transferCount: number;
  /** Aktueller Squad-Wert (reine Spieler-Summe, ohne Cash) */
  teamValue: number;
  /** Netto-Teamwert: TV + Cash (also: Gesamt-Vermögen im Liga-Kontext) */
  netTeamValue: number;
  /** 24h-Veränderung des Squad-Werts (Σ tfhmvt) */
  dayGain: number;
  /** Anzahl Squad-Spieler */
  squadSize: number;
  /** Maximalbid auf einen Spieler — verkaufe teuersten Squad-Player für 67% MV */
  maxBidSingleSell: number;
  /** Theoretischer Maximalbid — verkaufe gesamten Squad für 67% MV */
  maxBidTotal: number;
  /** Saison-Punkte */
  seasonPoints?: number;
  /** Platzierung */
  placement?: number;
  /** Anzahl Bonus-Events (für Confidence-Anzeige) */
  bonusEventCount: number;
  /** Wenn true: kein Transfer-Daten-Zugriff (Cash könnte ungenau sein) */
  cashUncertain: boolean;
}

export interface ComputeManagerInput {
  userId: string;
  name: string;
  image?: string;
  initialBudget: number;
  transfers?: KbManagerTransfer[];
  squad?: KbManagerSquadResponse | null;
  /** Activities feed (gesamte Liga, wir filtern selbst nach userId) */
  activities?: KbActivity[];
  /** Optional: ranking-Eintrag für sp/spl */
  rankingEntry?: KbRankingUser;
}

export function computeManagerStats(inp: ComputeManagerInput): ManagerComputedStats {
  const transfers = inp.transfers ?? [];

  let totalBought = 0;
  let totalSold = 0;
  for (const t of transfers) {
    if (t.tty === 1) totalBought += t.trp ?? 0;
    else if (t.tty === 2) totalSold += t.trp ?? 0;
  }

  const myBonusActivities = (inp.activities ?? []).filter(
    (a) => a.u?.i === inp.userId && (a.t === 22 || a.t === 12)
  );
  const totalBonus = myBonusActivities.reduce((s, a) => {
    const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
    const bn = typeof data.bn === "number" ? data.bn : 0;
    return s + bn;
  }, 0);

  const cashEstimate =
    inp.initialBudget - totalBought + totalSold + totalBonus;

  const squadPlayers = inp.squad?.it ?? [];
  const teamValue = squadPlayers.reduce((s, p) => s + (p.mv ?? 0), 0);
  const dayGain = squadPlayers.reduce((s, p) => s + (p.tfhmvt ?? 0), 0);

  const liquidationValues = squadPlayers
    .map((p) => Math.floor((p.mv ?? 0) * SELL_TO_BANK_FACTOR))
    .sort((a, b) => b - a);
  const topLiq = liquidationValues[0] ?? 0;
  const maxBidTotal = cashEstimate + liquidationValues.reduce((s, v) => s + v, 0);
  const maxBidSingleSell = cashEstimate + topLiq;

  return {
    userId: inp.userId,
    name: inp.name,
    image: inp.image,
    initialBudget: inp.initialBudget,
    totalBought,
    totalSold,
    totalBonus,
    cashEstimate,
    transferBalance: totalSold - totalBought,
    transferCount: transfers.length,
    teamValue,
    netTeamValue: teamValue + cashEstimate,
    dayGain,
    squadSize: squadPlayers.length,
    maxBidSingleSell,
    maxBidTotal,
    seasonPoints: inp.rankingEntry?.sp,
    placement: inp.rankingEntry?.spl,
    bonusEventCount: myBonusActivities.length,
    // Ohne squad-Daten ist der Cash trotzdem aus Transfers berechenbar; ohne
    // transfers ist er nur "initial + bonus", was sehr ungenau wäre.
    cashUncertain: !inp.transfers || inp.transfers.length === 0,
  };
}

/** Bestimmt das Initial-Budget aus Liga-Daten (mit Fallbacks). */
export function detectInitialBudget(opts: {
  /** Liga-Overview b-Field */
  overviewBudget?: number;
  /** Eigenes /me/budget b-Field */
  myBudget?: number;
  /** Liga-Selection b (eigener aktueller Cash-Stand) */
  selectionBudget?: number;
}): number {
  // overview.b liefert das initial konfigurierte Liga-Budget
  if (opts.overviewBudget && opts.overviewBudget > 0) return opts.overviewBudget;
  // Fallback: 50 Mio (Bundesliga-Default)
  return 50_000_000;
}

/** Rechnet einen Cash-Wert in Mio €/Tsd € als Display-String. */
export function formatCashCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000)
    return `${sign}${(abs / 1_000_000).toFixed(1).replace(".", ",")} Mio`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)} Tsd`;
  return `${sign}${abs}`;
}
