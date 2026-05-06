/**
 * kicker.de RSS — Bundesliga-Übersicht.
 * Tagger erkennt Spieler und Vereine via Player-Index.
 */

import type { NewsSource } from "../types";
import { fetchRssFeed } from "./rss-helper";

export const KICKER_BL_RSS = "https://newsfeed.kicker.de/news/bundesliga";

export const kickerSource: NewsSource = {
  id: "kicker-bl",
  displayName: "kicker.de",
  type: "media",
  intervalMinutes: 30,
  async fetch() {
    return fetchRssFeed(KICKER_BL_RSS, "kicker-bl", { maxItems: 15 });
  },
};
