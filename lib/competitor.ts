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

/**
 * Kickbase-Bonus-Konstanten — recherchiert aus help.kickbase.com.
 * Quelle: "Welche Erfolge kann ich in der App erhalten?" (offizielle Doku)
 *
 * Spieltagspunkte sind KUMULATIV: 2000 Pkt löst Silber + Gold + Jahrhundert
 * gleichzeitig aus = 250k + 500k + 1Mio = 1.75 Mio.
 *
 * Einzelspieler-Bonusse kumulieren nicht in der gleichen Weise (jeder Tier
 * ist ein separater Erfolg pro Spieler — ein 500-Punkte-Spieler löst alle
 * 4 Tiers aus = 100k+500k+1M+2M = 3.6 Mio).
 */
export const BONUS_RULES = {
  /** Tagesbonus für Login */
  LOGIN_PER_DAY: 100_000,
  /** Spieltagssieger (1. Platz an einem Spieltag) */
  MATCHDAY_WIN: 1_000_000,
  /** Spieltagspunkte Silber (Team ≥ 1000 Pkt) */
  TEAM_POINTS_1000: 250_000,
  /** Spieltagspunkte Gold (Team ≥ 1500 Pkt) */
  TEAM_POINTS_1500: 500_000,
  /** Jahrhundertspiel (Team ≥ 2000 Pkt) */
  TEAM_POINTS_2000: 1_000_000,
  /** Topscorer (1 Spieler ≥ 200 Pkt) */
  PLAYER_200: 100_000,
  /** Matchwinner (1 Spieler ≥ 300 Pkt) */
  PLAYER_300: 500_000,
  /** Weltklasse (1 Spieler ≥ 400 Pkt) */
  PLAYER_400: 1_000_000,
  /** Fussballgott (1 Spieler ≥ 500 Pkt) */
  PLAYER_500: 2_000_000,
  /** MVP — stärkster Spieler eines Spieltags league-wide */
  MVP: 1_000_000,
  /** Spieler-Profit-Erfolge (Bronze/Silver/Gold/König Hand) */
  HAND_BRONZE_THRESHOLD: 3_000_000,
  HAND_BRONZE: 250_000,
  HAND_SILVER_THRESHOLD: 5_000_000,
  HAND_SILVER: 500_000,
  HAND_GOLD_THRESHOLD: 10_000_000,
  HAND_GOLD: 1_000_000,
  HAND_KOENIG_THRESHOLD: 25_000_000,
  HAND_KOENIG: 2_000_000,
  /** Saisonende-Boni */
  MEISTER: 2_000_000,
  VIZEMEISTER: 1_000_000,
  /** Tormaschine (meiste Tore in der Liga) */
  TORMASCHINE: 250_000,
};

/** Berechne Spieltagspunkte-Bonus kumulativ aus Team-Punkten am Spieltag */
export function teamPointsBonus(mdp: number): number {
  let bonus = 0;
  if (mdp >= 1000) bonus += BONUS_RULES.TEAM_POINTS_1000;
  if (mdp >= 1500) bonus += BONUS_RULES.TEAM_POINTS_1500;
  if (mdp >= 2000) bonus += BONUS_RULES.TEAM_POINTS_2000;
  return bonus;
}

export interface ManagerComputedStats {
  userId: string;
  name: string;
  image?: string;
  initialBudget: number;
  /** Σ Kaufsummen */
  totalBought: number;
  /** Σ Verkaufssummen */
  totalSold: number;
  /** Σ explizite Bonus-Auszahlungen aus Activity-Feed */
  totalBonus: number;
  /** Geschätzter Login-Bonus (100k × Tage) */
  estimatedLoginBonus: number;
  /** Tage seit erster Aktivität in der Liga */
  daysActive: number;
  /** Σ geschätzte Spieltagsboni aus Ranking-History (Spieltagssieger + Punkte-Tiers) */
  estimatedMatchdayBonus: number;
  /** Σ realer Achievement-Bonus (nur für eigenen User; aus /user/achievements) */
  realAchievementBonus?: number;
  /** Achievement-Breakdown (nur für eigenen User) */
  achievementBreakdown?: Array<{ t: number; n: string; ac: number; er: number; total: number }>;
  /** Aktueller Cash-Stand. Wenn realCash an computeManagerStats übergeben
   *  wurde (eigener User), ist dieser Wert EXAKT (aus /me/budget).
   *  Sonst Schätzung aus Initial − Käufe + Verkäufe + Boni + Login + Erfolge. */
  cashEstimate: number;
  /** True wenn cashEstimate aus /me/budget kommt (exakt) statt geschätzt */
  cashIsReal: boolean;
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
  /** Pro-Spieltag-Rankings: für Berechnung der Spieltagsboni */
  perMatchdayRankings?: KbRankingUser[][];
  /** Echte Achievement-Daten (nur für eigenen User abrufbar) */
  achievements?: {
    items: Array<{ t: number; n: string; ac?: number; er: number; total: number }>;
    total: number;
  };
  /** REAL Cash-Wert direkt aus /me/budget (nur für eigenen User verfügbar) */
  realCash?: number;
}

export function computeManagerStats(inp: ComputeManagerInput): ManagerComputedStats {
  const transfers = inp.transfers ?? [];

  let totalBought = 0;
  let totalSold = 0;
  let earliestTxMs = Number.POSITIVE_INFINITY;
  for (const t of transfers) {
    if (t.tty === 1) totalBought += t.trp ?? 0;
    else if (t.tty === 2) totalSold += t.trp ?? 0;
    const ts = new Date(t.dt).getTime();
    if (!isNaN(ts) && ts < earliestTxMs) earliestTxMs = ts;
  }

  // Permissive bonus detection: any activity with data.bn (numeric > 0).
  // The Kickbase activity feed has multiple t-codes for bonuses (22 + others)
  // and `u` attribution is sometimes absent. We accept any activity with bn.
  const myBonusActivities = (inp.activities ?? []).filter((a) => {
    const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
    const bn = data.bn;
    if (typeof bn !== "number" || bn <= 0) return false;
    // If user is attributed, must match. Otherwise accept (likely auth-user feed).
    if (a.u?.i !== undefined) return a.u.i === inp.userId;
    return true;
  });
  const totalBonus = myBonusActivities.reduce((s, a) => {
    const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
    const bn = typeof data.bn === "number" ? data.bn : 0;
    return s + bn;
  }, 0);

  // Login-Bonus-Schätzung: 100k × Tage seit erster Aktivität
  // Wir nehmen das früheste Transfer-Datum als Proxy für "League-Beitritt"
  const now = Date.now();
  const daysActive =
    isFinite(earliestTxMs) && earliestTxMs < now
      ? Math.floor((now - earliestTxMs) / 86_400_000)
      : 0;
  const estimatedLoginBonus = daysActive * BONUS_RULES.LOGIN_PER_DAY;

  // Matchday-Bonus aus per-matchday Rankings (Spieltagssieger + Team-Punkte-Tiers)
  let estimatedMatchdayBonus = 0;
  if (inp.perMatchdayRankings) {
    for (const md of inp.perMatchdayRankings) {
      const me = md.find((u) => u.i === inp.userId);
      if (!me) continue;
      if (me.mdpl === 1) estimatedMatchdayBonus += BONUS_RULES.MATCHDAY_WIN;
      const mdp = me.mdp ?? 0;
      estimatedMatchdayBonus += teamPointsBonus(mdp);
    }
  }

  // Wenn echte Achievement-Daten verfügbar (eigener User) → diese statt
  // estimatedMatchdayBonus verwenden (sind genauer + enthalten Einzelspieler/MVP/Hand)
  const realAchievementBonus = inp.achievements?.total;
  const achievementBonusFinal =
    realAchievementBonus !== undefined ? realAchievementBonus : estimatedMatchdayBonus;

  // Wenn realCash verfügbar (eigener User), den ECHTEN Wert aus /me/budget
  // verwenden — alle Schätzungen werden überflüssig
  const cashEstimate =
    inp.realCash !== undefined
      ? inp.realCash
      : inp.initialBudget -
        totalBought +
        totalSold +
        totalBonus +
        estimatedLoginBonus +
        achievementBonusFinal;

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
    estimatedLoginBonus,
    daysActive,
    estimatedMatchdayBonus,
    realAchievementBonus,
    achievementBreakdown: inp.achievements?.items.map((a) => ({
      t: a.t,
      n: a.n,
      ac: a.ac ?? 0,
      er: a.er,
      total: a.total,
    })),
    cashEstimate,
    cashIsReal: inp.realCash !== undefined,
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
