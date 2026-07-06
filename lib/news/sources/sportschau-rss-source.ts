/**
 * Sportschau (ARD) – Sport-RSS, BL-übergreifend.
 * 50+ Items, frei zugänglich, sehr zuverlässig.
 */

import type { NewsSource } from "../types";
import { fetchRssFeed } from "./rss-helper";

export const SPORTSCHAU_RSS = "https://www.sportschau.de/index~rss2.xml";

export const sportschauSource: NewsSource = {
  id: "sportschau",
  displayName: "Sportschau (ARD)",
  type: "media",
  intervalMinutes: 30,
  async fetch() {
    const items = await fetchRssFeed(SPORTSCHAU_RSS, "sportschau", {
      maxItems: 20,
    });
    // Sportschau ist breit (auch andere Sportarten) – wir filtern auf Fußball/BL
    return items.filter((it) => {
      const text = `${it.title} ${it.body ?? ""}`.toLowerCase();
      return (
        text.includes("bundesliga") ||
        text.includes("fußball") ||
        text.includes("fussball") ||
        // typische BL-Vereine im Title als Indikator
        /\b(bayern|dortmund|leipzig|leverkusen|frankfurt|stuttgart|wolfsburg|bremen|freiburg|mainz|augsburg|hoffenheim|union|gladbach|köln|koeln|st. pauli|heidenheim|hsv|hamburger sv)\b/.test(
          text
        )
      );
    });
  },
};
