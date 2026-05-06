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

export const CLUB_RSS_FEEDS: Array<{
  slug: string;
  name: string;
  rssUrl: string | null;
}> = [
  // VERIFIED LIVE — diese RSSs liefern aktuell Daten
  { slug: "fcb", name: "FC Bayern München", rssUrl: "https://fcbayern.com/de/news/rss" },
  { slug: "sge", name: "Eintracht Frankfurt", rssUrl: "https://www.eintracht.de/aktuell/?type=2" },
  // 11 Vereine ohne aktuell funktionierendes offizielles RSS — werden via
  // Kicker.de (BL-übergreifend) und Spieler-Tagging abgedeckt. Mourice kann
  // gefundene URLs hier eintragen sobald er welche findet.
  { slug: "bvb", name: "Borussia Dortmund", rssUrl: null /* TODO: bvb.de RSS aktuell 404 */ },
  { slug: "rbl", name: "RB Leipzig", rssUrl: null /* TODO: kein offizielles RSS gefunden */ },
  { slug: "b04", name: "Bayer 04 Leverkusen", rssUrl: null /* TODO: alte URL 404 */ },
  { slug: "wob", name: "VfL Wolfsburg", rssUrl: null /* TODO: alte URL 404 */ },
  { slug: "vfb", name: "VfB Stuttgart", rssUrl: null /* TODO: alte URL 404 */ },
  { slug: "svw", name: "Werder Bremen", rssUrl: null /* TODO: aktuell 429 Rate-Limit */ },
  { slug: "scf", name: "SC Freiburg", rssUrl: null /* TODO: alte URL 404 */ },
  { slug: "m05", name: "Mainz 05", rssUrl: null /* TODO */ },
  { slug: "fca", name: "FC Augsburg", rssUrl: null /* TODO */ },
  { slug: "tsg", name: "TSG Hoffenheim", rssUrl: null /* TODO */ },
  { slug: "fcu", name: "1. FC Union Berlin", rssUrl: null /* TODO */ },
  { slug: "bmg", name: "Borussia Mönchengladbach", rssUrl: null /* TODO: alte URL 404 */ },
  { slug: "fck", name: "1. FC Köln", rssUrl: null /* TODO: alte URL 404 */ },
  { slug: "fcsp", name: "FC St. Pauli", rssUrl: null /* TODO: alte URL 404 */ },
  { slug: "fch", name: "1. FC Heidenheim", rssUrl: null /* TODO */ },
  { slug: "hsv", name: "Hamburger SV", rssUrl: null /* TODO: alte URL 404 */ },
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
      return fetchRssFeed(cfg.rssUrl, sourceId, { maxItems: 25 });
    },
  };
}

export function buildClubRssSources(): NewsSource[] {
  return CLUB_RSS_FEEDS.filter((f) => f.rssUrl).map((f) =>
    makeClubRssSource({ slug: f.slug, name: f.name, rssUrl: f.rssUrl as string })
  );
}
