/**
 * Vereins-RSS-Sources für die 18 Bundesliga-Klubs.
 *
 * URLs unten sind beste Schätzungen Stand 2026 — manche Vereine haben
 * keine offiziellen RSS-Feeds publiziert. Diese sind als `null` markiert
 * und Mourice kann die manuell ergänzen wenn er passende URLs findet.
 *
 * Wichtig: nur Headline + max 280 Zeichen Body wird gespeichert
 * (Pressespiegel-Recht §87f UrhG). Source-URL ist Pflicht.
 */

import type { NewsSource } from "../types";
import { fetchRssFeed } from "./rss-helper";

/**
 * Club-Sources nutzen Google News RSS als zuverlässigen Aggregator
 * (Stand 2026 sind viele offizielle Vereins-RSSs 404 oder eingeschränkt).
 * Google News Search-Feed liefert pro Verein die top-Sport-Artikel aus allen
 * deutschen News-Quellen (kicker, sport1, sportschau, transfermarkt etc.).
 *
 * Format: https://news.google.com/rss/search?q=<query>&hl=de&gl=DE&ceid=DE:de
 */

const gnews = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(
    query
  )}&hl=de&gl=DE&ceid=DE:de`;

export const CLUB_RSS_FEEDS: Array<{
  slug: string;
  name: string;
  /** Bevorzugt: offizieller Vereins-RSS. Fallback: Google News Aggregator */
  rssUrl: string;
}> = [
  // FC Bayern offizielles RSS ist zu langsam (10s+ Timeout) → Google News
  { slug: "fcb", name: "FC Bayern München", rssUrl: gnews("Bayern München Bundesliga") },
  // Eintracht Frankfurt: offizieller RSS funktioniert
  { slug: "sge", name: "Eintracht Frankfurt", rssUrl: "https://www.eintracht.de/aktuell/?type=2" },
  // Alle anderen via Google News (offizielle RSSs zu instabil)
  { slug: "bvb", name: "Borussia Dortmund", rssUrl: gnews("Borussia Dortmund Bundesliga") },
  { slug: "rbl", name: "RB Leipzig", rssUrl: gnews("RB Leipzig Bundesliga") },
  { slug: "b04", name: "Bayer 04 Leverkusen", rssUrl: gnews("Bayer Leverkusen Bundesliga") },
  { slug: "wob", name: "VfL Wolfsburg", rssUrl: gnews("VfL Wolfsburg Bundesliga") },
  { slug: "vfb", name: "VfB Stuttgart", rssUrl: gnews("VfB Stuttgart Bundesliga") },
  { slug: "svw", name: "Werder Bremen", rssUrl: gnews("Werder Bremen Bundesliga") },
  { slug: "scf", name: "SC Freiburg", rssUrl: gnews("SC Freiburg Bundesliga") },
  { slug: "m05", name: "Mainz 05", rssUrl: gnews("Mainz 05 Bundesliga") },
  { slug: "fca", name: "FC Augsburg", rssUrl: gnews("FC Augsburg Bundesliga") },
  { slug: "tsg", name: "TSG Hoffenheim", rssUrl: gnews("TSG Hoffenheim Bundesliga") },
  { slug: "fcu", name: "1. FC Union Berlin", rssUrl: gnews("1. FC Union Berlin Bundesliga") },
  { slug: "bmg", name: "Borussia Mönchengladbach", rssUrl: gnews("Borussia Mönchengladbach Bundesliga") },
  { slug: "fck", name: "1. FC Köln", rssUrl: gnews("1. FC Köln Bundesliga") },
  { slug: "fcsp", name: "FC St. Pauli", rssUrl: gnews("FC St. Pauli Bundesliga") },
  { slug: "fch", name: "1. FC Heidenheim", rssUrl: gnews("1. FC Heidenheim Bundesliga") },
  { slug: "hsv", name: "Hamburger SV", rssUrl: gnews("Hamburger SV Bundesliga") },
];

export function makeClubRssSource(cfg: {
  slug: string;
  name: string;
  rssUrl: string;
}): NewsSource {
  const sourceId = `club-${cfg.slug}`;
  return {
    id: sourceId,
    displayName: cfg.name,
    type: "club",
    clubSlug: cfg.slug,
    intervalMinutes: 30,
    async fetch() {
      // Limit auf 10 — bei 26 Sources × 10 = 260 max items, passt in 60s
      return fetchRssFeed(cfg.rssUrl, sourceId, { maxItems: 10 });
    },
  };
}

export function buildClubRssSources(): NewsSource[] {
  return CLUB_RSS_FEEDS.map((f) =>
    makeClubRssSource({ slug: f.slug, name: f.name, rssUrl: f.rssUrl })
  );
}
