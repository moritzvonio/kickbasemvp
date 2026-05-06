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
  { slug: "fcb", name: "FC Bayern München", rssUrl: "https://fcbayern.com/de/news/rss" },
  { slug: "bvb", name: "Borussia Dortmund", rssUrl: "https://www.bvb.de/RSS" },
  { slug: "rbl", name: "RB Leipzig", rssUrl: null /* TODO: kein offizielles RSS gefunden */ },
  { slug: "b04", name: "Bayer 04 Leverkusen", rssUrl: "https://www.bayer04.de/de-de/feed/news" },
  { slug: "sge", name: "Eintracht Frankfurt", rssUrl: "https://www.eintracht.de/aktuell/?type=2" },
  { slug: "wob", name: "VfL Wolfsburg", rssUrl: "https://www.vfl-wolfsburg.de/news.rss" },
  { slug: "vfb", name: "VfB Stuttgart", rssUrl: "https://www.vfb.de/de/vfb/news/rss-feed/" },
  { slug: "svw", name: "Werder Bremen", rssUrl: "https://www.werder.de/news.rss" },
  { slug: "scf", name: "SC Freiburg", rssUrl: "https://www.scfreiburg.com/news.rss" },
  { slug: "m05", name: "Mainz 05", rssUrl: null /* TODO */ },
  { slug: "fca", name: "FC Augsburg", rssUrl: null /* TODO */ },
  { slug: "tsg", name: "TSG Hoffenheim", rssUrl: null /* TODO */ },
  { slug: "fcu", name: "1. FC Union Berlin", rssUrl: null /* TODO */ },
  { slug: "bmg", name: "Borussia Mönchengladbach", rssUrl: "https://www.borussia.de/de/feed.html" },
  { slug: "fck", name: "1. FC Köln", rssUrl: "https://fc.de/news.rss" },
  { slug: "fcsp", name: "FC St. Pauli", rssUrl: "https://www.fcstpauli.com/news.rss" },
  { slug: "fch", name: "1. FC Heidenheim", rssUrl: null /* TODO */ },
  { slug: "hsv", name: "Hamburger SV", rssUrl: "https://www.hsv.de/news.rss" },
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
