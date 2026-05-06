/**
 * Bid-Pattern-Analyzer.
 *
 * Erkennt aus der Transfer-History eines Liga-Mitglieds, wie er typischerweise
 * bietet — auf welche Rundungs-Stufen, mit welchem Premium über Marktwert,
 * wie häufig. Ergebnis ist eine Heuristik-basierte Bid-Empfehlung der Form
 * „Biete X.X Mio + 1k um diesen Manager zu schlagen".
 */

import type { KbManagerTransfer } from "./kickbase/types";

export interface BidPattern {
  /** Anzahl analysierter Käufe */
  buyCount: number;
  /** Anteil Bids die exakt auf .000.000 enden (volle Mio) */
  roundMillionPct: number;
  /** Anteil Bids auf .500.000 (halbe Mio) */
  roundHalfPct: number;
  /** Anteil Bids auf .X00.000 (volle 100k aber nicht .500/.000) */
  roundHundredPct: number;
  /** Anteil "Sniper"-Bids (krumme Beträge wie 7.012.345) */
  sniperPct: number;
  /** Median-Bid in Euro (aus den letzten Käufen, hilft bei Größenordnung) */
  medianBid: number;
  /** Höchstes Bid (zeigt Aggressivität / Budget) */
  maxBid: number;
  /**
   * Erkanntes Bid-Profil als Label.
   *  - "round" = bevorzugt klare Rundzahlen → mit +1k drüber sicher schlagbar
   *  - "fine"  = bevorzugt fein (10k-Schritte) → +50k Premium nötig
   *  - "sniper"= biete krumm um round-User zu schlagen → echte Auktions-Mentalität
   */
  profile: "round" | "fine" | "sniper" | "unknown";
}

/**
 * Analysiert die Transfer-History eines Managers und liefert ein Bid-Profil.
 */
export function analyzeBidPattern(
  transfers: KbManagerTransfer[]
): BidPattern {
  const buys = transfers.filter(
    (t) => t.tty === 1 && typeof t.trp === "number" && t.trp > 0
  );
  const buyCount = buys.length;

  if (buyCount === 0) {
    return {
      buyCount: 0,
      roundMillionPct: 0,
      roundHalfPct: 0,
      roundHundredPct: 0,
      sniperPct: 0,
      medianBid: 0,
      maxBid: 0,
      profile: "unknown",
    };
  }

  let roundMillion = 0;
  let roundHalf = 0;
  let roundHundred = 0;
  let sniper = 0;
  const bids: number[] = [];

  for (const t of buys) {
    const trp = t.trp ?? 0;
    bids.push(trp);
    if (trp % 1_000_000 === 0) {
      roundMillion++;
    } else if (trp % 500_000 === 0) {
      roundHalf++;
    } else if (trp % 100_000 === 0) {
      roundHundred++;
    } else {
      sniper++;
    }
  }

  bids.sort((a, b) => a - b);
  const medianBid = bids[Math.floor(bids.length / 2)] ?? 0;
  const maxBid = bids[bids.length - 1] ?? 0;

  const roundMillionPct = roundMillion / buyCount;
  const roundHalfPct = roundHalf / buyCount;
  const roundHundredPct = roundHundred / buyCount;
  const sniperPct = sniper / buyCount;

  // Profil ableiten
  let profile: BidPattern["profile"];
  if (buyCount < 3) {
    profile = "unknown";
  } else if (roundMillionPct + roundHalfPct >= 0.5) {
    profile = "round"; // dominant round → mit +1k sicher schlagbar
  } else if (sniperPct >= 0.4) {
    profile = "sniper"; // selbst Sniper → schwer zu lesen
  } else {
    profile = "fine"; // bevorzugt 100k-Schritte
  }

  return {
    buyCount,
    roundMillionPct,
    roundHalfPct,
    roundHundredPct,
    sniperPct,
    medianBid,
    maxBid,
    profile,
  };
}

/**
 * Berechnet einen empfohlenen Bid um einen Manager mit gegebenem Profil
 * zu schlagen, gegeben einen Marktwert.
 *
 * Strategie pro Profil:
 *  - round   → biete `roundedUp + 1` (+1 €), schlägt auf den Cent — sehr knapp
 *  - fine    → biete `roundedUp + 50_000` (Schutzpolster für 50k-Steps)
 *  - sniper  → biete `mv + 5%` (defensiv, sniper kann ANYTHING)
 *  - unknown → biete `mv + 1%` (Default, leichte Über-MV-Marge)
 */
export interface BidRecommendation {
  /** Empfohlener minimaler Bid um diesen Manager zu schlagen */
  minBidToBeat: number;
  /** "Sicherer" Bid mit kleinem Polster — empfohlen */
  safeBid: number;
  /** Reasoning für die UI */
  rationale: string;
}

export function recommendBid(
  marketValue: number,
  pattern: BidPattern
): BidRecommendation {
  const ceilToMillion = (v: number) => Math.ceil(v / 1_000_000) * 1_000_000;
  const ceilToHalf = (v: number) =>
    Math.ceil(v / 500_000) * 500_000;
  const ceilToHundred = (v: number) =>
    Math.ceil(v / 100_000) * 100_000;

  switch (pattern.profile) {
    case "round": {
      // Wahrscheinlichstes Konkurrenz-Bid: nächste runde Million ODER halbe Mio
      const competitorLikely = pattern.roundMillionPct > pattern.roundHalfPct
        ? ceilToMillion(marketValue)
        : ceilToHalf(marketValue);
      return {
        minBidToBeat: competitorLikely + 1,
        safeBid: competitorLikely + 100_000,
        rationale: `Manager bietet meist runde Beträge (${Math.round(
          pattern.roundMillionPct * 100
        )}% volle Mio, ${Math.round(
          pattern.roundHalfPct * 100
        )}% halbe Mio). Empfehlung: ${formatM(
          competitorLikely + 100_000
        )} schlägt sein wahrscheinliches ${formatM(competitorLikely)} klar.`,
      };
    }
    case "fine": {
      const competitorLikely = ceilToHundred(marketValue);
      return {
        minBidToBeat: competitorLikely + 1,
        safeBid: competitorLikely + 50_000,
        rationale: `Manager bietet meist auf 100k-Schritte. Empfehlung: ${formatM(
          competitorLikely + 50_000
        )} mit 50k-Polster über erwartetem ${formatM(competitorLikely)}.`,
      };
    }
    case "sniper": {
      const safeBid = Math.ceil(marketValue * 1.05);
      return {
        minBidToBeat: safeBid,
        safeBid,
        rationale: `Manager bietet "snipernd" (${Math.round(
          pattern.sniperPct * 100
        )}% krumme Beträge). Schwer zu antizipieren — empfohlen: +5% über MV als Schutzpolster (${formatM(
          safeBid
        )}).`,
      };
    }
    default: {
      const safeBid = Math.ceil(marketValue * 1.01);
      return {
        minBidToBeat: safeBid,
        safeBid: Math.ceil(marketValue * 1.05),
        rationale:
          pattern.buyCount === 0
            ? "Keine Käufe analysierbar — Default-Empfehlung +1% über MV."
            : `Zu wenige Käufe (${pattern.buyCount}) für robustes Profil. +1% über MV.`,
      };
    }
  }
}

function formatM(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(".", ",")} Mio`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} Tsd`;
  return `${n}`;
}
