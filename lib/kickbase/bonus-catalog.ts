/**
 * Kickbase-Bonus-Katalog — EMPIRISCH VERIFIZIERT gegen die echte API
 * (Snapshots 2026-07-06, 3 Ligen, eigener Account als Wahrheits-Anker).
 *
 * Validierung: Σ ac×er == /user/achievements API-total (Liga 089: 42,85M ✓,
 * Liga 23/24: 66,65M ✓). Der Detail-Endpoint kann in Alt-Ligen er=0 liefern —
 * dann diesen Katalog als Fallback nutzen.
 *
 * Siehe docs/kickbase-bonus-regeln.md für die Herleitung.
 */

/** Auszahlung (er) pro Achievement-Typ (t) — aus /user/achievements/{t}. */
export const ACHIEVEMENT_ER: Record<number, number> = {
  // Spieltagssieger-Serie (triggert in unseren Ligen NICHT — ac=0 trotz Siegen)
  1: 500_000, // Spieltagssieger Bronze
  2: 1_000_000, // Spieltagssieger Silber
  3: 1_500_000, // Spieltagssieger Gold
  4: 2_000_000, // The Special One
  5: 1_000_000, // Spieltagssieger
  // Spieltagspunkte-Tiers — EXKLUSIV: nur der höchste erreichte Tier pro
  // Spieltag zahlt (verifiziert: 1/24/5/0 bei 34 Spieltagen, avg 1165 Pkt)
  100: 100_000, // Bronze (>= 500)
  101: 250_000, // Silber (>= 1000)
  102: 1_000_000, // Gold (>= 1500)
  103: 2_000_000, // Jahrhundertspiel (>= 2000)
  // Saisonpunkte-Meilensteine (in unseren Ligen nie getriggert, ac=0 überall)
  200: 100_000,
  201: 250_000,
  202: 500_000,
  203: 1_000_000,
  204: 2_000_000, // Weltpokalsieger
  // Einzelspieler-Punkte pro Spieltag (EXKLUSIV pro Spieler+Spieltag angenommen)
  300: 100_000, // Topscorer (1 Spieler >= 200 Pkt)
  301: 500_000, // Matchwinner (>= 300)
  302: 1_000_000, // Weltklasse (>= 400)
  303: 2_000_000, // Fussballgott (>= 500)
  // Mannschaftswert-Meilensteine (einmalig pro Liga)
  400: 100_000, // Bronze
  401: 250_000, // Silber
  402: 500_000, // Gold
  403: 1_000_000, // Platin
  404: 2_000_000, // Die Galaktischen
  // Transferkönig-Serie (in unseren Ligen nie getriggert — vermutlich inaktiv)
  500: 100_000, // Erster Deal
  501: 250_000,
  502: 500_000,
  503: 1_000_000,
  504: 2_000_000, // F. Magath
  // Liga-Level (einmalig, bei allen Ligen ac=1 für Kreis+Regional)
  600: 1_000_000, // Kreisliga
  601: 1_000_000, // Regionalliga
  602: 1_000_000, // 2. Liga
  603: 1_000_000, // 1. Liga
  // Händchen-Serie (realisierter Trading-Profit pro Spieler, EXKLUSIV)
  700: 100_000, // Glückliches Händchen
  701: 250_000, // Bronzenes Händchen
  702: 500_000, // Silbernes Händchen
  703: 1_000_000, // Goldenes Händchen
  704: 2_000_000, // Königstransfer
  // Verwaltung / Saisonende
  900: 0, // Managerlizenz
  2001: 2_000_000, // Meister
  2002: 1_000_000, // Vizemeister
  // Einmalige Kleinigkeiten
  3000: 100_000, // Lange Bank
  4000: 100_000, // Panini
  4001: 100_000, // Choreo
  5001: 1_000_000, // MVP (stärkster Spieler eines Spieltags, league-wide)
  7502: 250_000, // Tormaschine
};

/** Spieltagspunkte-Tiers, absteigend. EXKLUSIV: nur höchster Tier zahlt. */
export const TEAM_POINT_TIERS: Array<{ min: number; er: number; t: number }> = [
  { min: 2000, er: ACHIEVEMENT_ER[103], t: 103 },
  { min: 1500, er: ACHIEVEMENT_ER[102], t: 102 },
  { min: 1000, er: ACHIEVEMENT_ER[101], t: 101 },
  { min: 500, er: ACHIEVEMENT_ER[100], t: 100 },
];

/** Exklusiver Tier-Payout für einen Spieltag mit mdp Team-Punkten. */
export function teamPointsTierPayout(mdp: number): number {
  for (const tier of TEAM_POINT_TIERS) if (mdp >= tier.min) return tier.er;
  return 0;
}

/**
 * Tagesbonus (Login): streak-basiert, Tag 1 = 10k, +10k/Tag bis Cap 100k ab
 * Tag 10. Global über alle Ligen gespiegelt (t=22-Feed-Events, nur eigener
 * User sichtbar). Verifiziert aus Feed-Rekonstruktion Aug 2025 – Jul 2026.
 */
export const DAILY_BONUS_CAP = 100_000;
export const DAILY_BONUS_RAMP_TOTAL = 550_000; // Σ Tag 1..10 (10k+20k+...+100k)

/** Punkteprämie: 1.000 € pro Saisonpunkt, still ausgezahlt (keine Feed-Events). */
export const POINTS_PREMIUM_PER_POINT = 1_000;

/**
 * Spieltagssieg-Prämie: 1M pro Sieg (offiziell, help.kickbase.com "Erfolge").
 * Zahlt als eigenständige Prämie — das Achievement t=5 bleibt dabei ac=0.
 * Platz 2/3 erhalten nichts (offiziell bestätigt, keine Staffelung).
 */
export const MATCHDAY_WIN_PREMIUM = 1_000_000;

/** Startbudget einer frischen Liga (Bundesliga-Standard). */
export const INITIAL_BUDGET = 50_000_000;

/** Verkauf an die Liga bringt 67 % des Marktwerts (33 %-Regel, verifiziert). */
export const SELL_TO_LEAGUE_FACTOR = 0.67;
