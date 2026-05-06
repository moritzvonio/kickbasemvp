/**
 * Competitor Analysis — back-computes per-manager cash from observable signals.
 *
 * Cash-Berechnung:
 *   cash = initialBudget
 *        - Σ(buy.trp)             // every buy reduces cash
 *        + Σ(sell.trp)             // every sell adds cash
 *        + Σ(activity.bn)          // bonus payouts aus Activity-Feed
 *        + Σ(mdp) × 1.000 €        // Punkteprämie pro Spieltagspunkt (Doku)
 *        + 100k × daysActive       // login-bonus extrapoliert
 *        + Σ achievements.total    // realer Achievement-Total (nur eigener User)
 *                ODER Σ estimatedMatchday + estimatedHand (Schätzung für andere)
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
  /** Tagesbonus für Login (nach Tag 10; Tag 1-10 staffelt 10k→100k) */
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
  /** Punkteprämie — pro Spieltagspunkt zahlt Kickbase 1.000 € automatisch aufs
   *  Konto, zusätzlich zu den Tier-Erfolgen. Quelle: help.kickbase.com
   *  "Wann werden die Punkteprämien ausgeschüttet" + Doku-Hinweis "Belohnungen
   *  basierend auf Matchday-Punkten". */
  EUR_PER_POINT: 1_000,
};

/**
 * Diagnose-Helper: Zeigt was uns NUMERISCH fehlt — keine Auto-Korrektur.
 * Für eigenen User berechenbar, weil wir realCash kennen.
 */
export function diagnoseMissingBonus(opts: {
  realCash: number;
  initialBudget: number;
  totalBought: number;
  totalSold: number;
  totalBonus: number;
  estimatedLoginBonus: number;
  realAchievementBonus: number;
  daysActive: number;
}): { totalMissing: number; perDay: number } {
  const accountedFor =
    opts.initialBudget -
    opts.totalBought +
    opts.totalSold +
    opts.totalBonus +
    opts.estimatedLoginBonus +
    opts.realAchievementBonus;
  const totalMissing = opts.realCash - accountedFor;
  const perDay = opts.daysActive > 0 ? totalMissing / opts.daysActive : 0;
  return { totalMissing, perDay };
}

/** Berechne Spieltagspunkte-Bonus kumulativ aus Team-Punkten am Spieltag */
export function teamPointsBonus(mdp: number): number {
  let bonus = 0;
  if (mdp >= 1000) bonus += BONUS_RULES.TEAM_POINTS_1000;
  if (mdp >= 1500) bonus += BONUS_RULES.TEAM_POINTS_1500;
  if (mdp >= 2000) bonus += BONUS_RULES.TEAM_POINTS_2000;
  return bonus;
}

/**
 * Berechne Hand-Bonus aus Transfer-History.
 * Für jeden Spieler: Σ Verkäufe − Σ Käufe = realisierter Profit.
 * Wenn ≥ 3M: Bronze, ≥ 5M: + Silber, ≥ 10M: + Gold, ≥ 25M: + König (alle Tiers kumulieren).
 *
 * Nur wenn der Spieler MINDESTENS 1× verkauft wurde (sonst kein realized profit).
 */
export function computeHandBonus(transfers: KbManagerTransfer[]): {
  bonus: number;
  perPlayer: Array<{ pid: string; pn: string; profit: number; tier: string; payout: number }>;
} {
  const byPid = new Map<
    string,
    { pn: string; buys: number; sells: number; sellCount: number }
  >();
  for (const t of transfers) {
    if (!t.pi) continue;
    const cur = byPid.get(t.pi) ?? { pn: t.pn, buys: 0, sells: 0, sellCount: 0 };
    if (t.tty === 1) cur.buys += t.trp ?? 0;
    else if (t.tty === 2) {
      cur.sells += t.trp ?? 0;
      cur.sellCount += 1;
    }
    if (!cur.pn && t.pn) cur.pn = t.pn;
    byPid.set(t.pi, cur);
  }

  let bonus = 0;
  const perPlayer: Array<{ pid: string; pn: string; profit: number; tier: string; payout: number }> = [];

  for (const [pid, e] of byPid) {
    if (e.sellCount === 0) continue;
    const profit = e.sells - e.buys;
    if (profit < BONUS_RULES.HAND_BRONZE_THRESHOLD) continue;
    let payout = 0;
    let tier = "";
    if (profit >= BONUS_RULES.HAND_BRONZE_THRESHOLD) {
      payout += BONUS_RULES.HAND_BRONZE;
      tier = "Bronze";
    }
    if (profit >= BONUS_RULES.HAND_SILVER_THRESHOLD) {
      payout += BONUS_RULES.HAND_SILVER;
      tier = "Silber";
    }
    if (profit >= BONUS_RULES.HAND_GOLD_THRESHOLD) {
      payout += BONUS_RULES.HAND_GOLD;
      tier = "Gold";
    }
    if (profit >= BONUS_RULES.HAND_KOENIG_THRESHOLD) {
      payout += BONUS_RULES.HAND_KOENIG;
      tier = "König";
    }
    bonus += payout;
    perPlayer.push({ pid, pn: e.pn || pid, profit, tier, payout });
  }

  perPlayer.sort((a, b) => b.payout - a.payout);
  return { bonus, perPlayer };
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
  /** Geschätzte Punkteprämie für ABGESCHLOSSENE Spieltage: Σ mdp × 1.000 € */
  estimatedPointsBonus: number;
  /** Σ aller mdp aus abgeschlossenen Spieltagen */
  totalMatchdayPoints: number;
  /** Punkte des aktuellen/laufenden Spieltags — noch nicht ausgezahlt */
  openMatchdayPoints: number;
  /** Wert des laufenden Spieltags = openMatchdayPoints × 1.000 €  */
  openMatchdayBonus: number;
  /** Geschätzter Login-Bonus (100k × Tage) */
  estimatedLoginBonus: number;
  /** Tage seit erster Aktivität in der Liga */
  daysActive: number;
  /** Σ geschätzte Spieltagsboni aus Ranking-History (Spieltagssieger + Punkte-Tiers) */
  estimatedMatchdayBonus: number;
  /** Σ Hand-Bonus aus Transfer-History (Bronze/Silber/Gold/König) */
  estimatedHandBonus: number;
  /** Pro-Spieler Hand-Bonus-Breakdown */
  handBonusBreakdown: Array<{ pid: string; pn: string; profit: number; tier: string; payout: number }>;
  /** Σ realer Achievement-Bonus (nur für eigenen User; aus /user/achievements) */
  realAchievementBonus?: number;
  /** Achievement-Breakdown (nur für eigenen User) */
  achievementBreakdown?: Array<{ t: number; n: string; ac: number; er: number; total: number }>;
  /** Geschätzter Cash-Stand: Initial − Käufe + Verkäufe + Boni + Login + Erfolge.
   *  IMMER eine Schätzung — auch für den eigenen User. So sind Manager-Cards
   *  apples-to-apples vergleichbar. */
  cashEstimate: number;
  /** Echter Cash aus /me/budget (nur für eigenen User verfügbar).
   *  Wird NUR zur Validierung gegen cashEstimate angezeigt, NICHT als Override. */
  realCashFromApi?: number;
  /** Diff = realCashFromApi − cashEstimate (Schätzfehler) */
  cashEstimateError?: number;
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
  /** Echter Cash aus /me/budget (NUR Vergleichsreferenz, kein Override) */
  realCashFromApi?: number;
}

export function computeManagerStats(inp: ComputeManagerInput): ManagerComputedStats {
  const transfers = inp.transfers ?? [];
  const activities = inp.activities ?? [];

  let totalBought = 0;
  let totalSold = 0;
  let earliestTxMs = Number.POSITIVE_INFINITY;
  for (const t of transfers) {
    if (t.tty === 1) totalBought += t.trp ?? 0;
    else if (t.tty === 2) totalSold += t.trp ?? 0;
    const ts = new Date(t.dt).getTime();
    if (!isNaN(ts) && ts < earliestTxMs) earliestTxMs = ts;
  }

  // Älteste user-zugeordnete Activity bestimmen — relevant für Login-Bonus,
  // weil ein Manager schon im Feed auftaucht bevor er den ersten Transfer macht.
  let earliestActivityMs = Number.POSITIVE_INFINITY;
  for (const a of activities) {
    if (a.u?.i !== undefined && a.u.i !== inp.userId) continue;
    if (a.dt === undefined) continue;
    const ts = new Date(a.dt).getTime();
    if (!isNaN(ts) && ts < earliestActivityMs) earliestActivityMs = ts;
  }

  const isMine = (a: KbActivity) =>
    a.u?.i === undefined ? true : a.u.i === inp.userId;

  const myBonusActivities = activities.filter((a) => {
    const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
    const bn = data.bn;
    if (typeof bn !== "number" || bn <= 0) return false;
    return isMine(a);
  });
  const totalBonus = myBonusActivities.reduce((s, a) => {
    const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
    const bn = typeof data.bn === "number" ? data.bn : 0;
    return s + bn;
  }, 0);

  // Login-Bonus: 100k × Tage seit ältester user-Aktivität (Activity ODER Transfer).
  // Activities reichen meist weiter zurück als Transfers — Liga-Beitritt vor erstem Transfer ist normal.
  const now = Date.now();
  const earliestMs = Math.min(earliestTxMs, earliestActivityMs);
  const daysActive =
    isFinite(earliestMs) && earliestMs < now
      ? Math.floor((now - earliestMs) / 86_400_000)
      : 0;
  const estimatedLoginBonus = daysActive * BONUS_RULES.LOGIN_PER_DAY;

  // Matchday-Bonus aus per-matchday Rankings (Spieltagssieger + Team-Punkte-Tiers)
  // Plus Punkteprämie: 1.000 € pro Spieltagspunkt, separat zur Tier-Erfolg-Auszahlung.
  // WICHTIG: der LETZTE Eintrag ist potenziell der laufende Spieltag — Kickbase zahlt
  // die Punkteprämie erst nach Abschluss aus. Wir trennen daher abgeschlossene und
  // offene Spieltage und addieren nur die abgeschlossenen ins cashEstimate.
  let estimatedMatchdayBonus = 0;
  let totalMatchdayPoints = 0;
  let openMatchdayPoints = 0;
  if (inp.perMatchdayRankings) {
    const mds = inp.perMatchdayRankings;
    const closedMds = mds.length > 1 ? mds.slice(0, -1) : [];
    const openMd = mds[mds.length - 1];

    for (const md of closedMds) {
      const me = md.find((u) => u.i === inp.userId);
      if (!me) continue;
      if (me.mdpl === 1) estimatedMatchdayBonus += BONUS_RULES.MATCHDAY_WIN;
      const mdp = me.mdp ?? 0;
      totalMatchdayPoints += mdp;
      estimatedMatchdayBonus += teamPointsBonus(mdp);
    }

    if (openMd) {
      const meOpen = openMd.find((u) => u.i === inp.userId);
      openMatchdayPoints = meOpen?.mdp ?? 0;
    }
  }
  const estimatedPointsBonus = totalMatchdayPoints * BONUS_RULES.EUR_PER_POINT;
  const openMatchdayBonus = openMatchdayPoints * BONUS_RULES.EUR_PER_POINT;

  // Hand-Bonus aus Transfer-History (für alle Manager berechenbar)
  const handResult = computeHandBonus(transfers);
  const estimatedHandBonus = handResult.bonus;

  // Wenn echte Achievement-Daten verfügbar (eigener User) → diese statt
  // estimatedMatchdayBonus + Hand verwenden (sind genauer + enthalten alles)
  const realAchievementBonus = inp.achievements?.total;
  const achievementBonusFinal =
    realAchievementBonus !== undefined
      ? realAchievementBonus
      : estimatedMatchdayBonus + estimatedHandBonus;

  // Cash IMMER schätzen — auch für eigenen User. Realwert separat zur Validierung.
  // Für eigenen User (realAchievementBonus vorhanden) ist totalBonus aus dem
  // Activity-Feed REDUNDANT — die data.bn-Auszahlungen sind bereits in
  // achievements.total + estimatedPointsBonus + estimatedLoginBonus enthalten.
  // Für andere Manager (keine /user/achievements verfügbar) brauchen wir
  // totalBonus weiterhin als beste verfügbare Bonus-Quelle.
  const isOwnUser = realAchievementBonus !== undefined;
  const cashEstimate =
    inp.initialBudget -
    totalBought +
    totalSold +
    (isOwnUser ? 0 : totalBonus) +
    estimatedPointsBonus +
    estimatedLoginBonus +
    achievementBonusFinal;

  // Diagnose-Log nur für eigenen User wenn DEBUG_CASH_PIPELINE=1 gesetzt ist.
  // Default off, damit der Server-Log nicht zugespamt wird.
  if (
    inp.realCashFromApi !== undefined &&
    process.env.DEBUG_CASH_PIPELINE === "1"
  ) {
    const fmt = (n: number) =>
      `${(n / 1_000_000).toFixed(2).replace(".", ",")} Mio`;
    console.log("\n[CASH-PIPELINE]", inp.name, "(eigener User)");
    console.log("  Initial-Budget         :", fmt(inp.initialBudget));
    console.log("  - Käufe (n=" + transfers.filter((t) => t.tty === 1).length + ")        :", "-" + fmt(totalBought));
    console.log("  + Verkäufe (n=" + transfers.filter((t) => t.tty === 2).length + ")     :", "+" + fmt(totalSold));
    console.log("  + Bonus-Feed bn (n=" + myBonusActivities.length + ")  :", "+" + fmt(totalBonus));
    console.log("  + Punkteprämie         :", "+" + fmt(estimatedPointsBonus), `(${totalMatchdayPoints} Pkt × 1k)`);
    console.log("  + Login-Bonus          :", "+" + fmt(estimatedLoginBonus), `(${daysActive} Tage × 100k)`);
    console.log("  + Achievements (real)  :", "+" + fmt(achievementBonusFinal), `(API total)`);
    console.log("  ============================================");
    console.log("  = cashEstimate         :", fmt(cashEstimate));
    console.log("  realCashFromApi        :", fmt(inp.realCashFromApi));
    console.log("  diff (real - estimate) :", fmt(inp.realCashFromApi - cashEstimate));
    if (inp.achievements) {
      console.log("\n  [Achievements-Detail]");
      for (const a of inp.achievements.items) {
        const ac = a.ac ?? 0;
        if (ac === 0 && a.total === 0) continue;
        console.log(`    t=${a.t} ${a.n} : ${ac}× × ${fmt(a.er)} = ${fmt(a.total)}`);
      }
      console.log("    Σ achievements.total :", fmt(inp.achievements.total));
    }
    console.log("\n  [Open Matchday]");
    console.log("    openMatchdayPoints   :", openMatchdayPoints, "Pkt =", fmt(openMatchdayBonus));
    console.log("    perMatchdayRankings  :", inp.perMatchdayRankings?.length ?? 0, "Spieltage");
  }
  const cashEstimateError =
    inp.realCashFromApi !== undefined
      ? inp.realCashFromApi - cashEstimate
      : undefined;

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
    estimatedPointsBonus,
    totalMatchdayPoints,
    openMatchdayPoints,
    openMatchdayBonus,
    estimatedLoginBonus,
    daysActive,
    estimatedMatchdayBonus,
    estimatedHandBonus,
    handBonusBreakdown: handResult.perPlayer,
    realAchievementBonus,
    achievementBreakdown: inp.achievements?.items.map((a) => ({
      t: a.t,
      n: a.n,
      ac: a.ac ?? 0,
      er: a.er,
      total: a.total,
    })),
    cashEstimate,
    realCashFromApi: inp.realCashFromApi,
    cashEstimateError,
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
