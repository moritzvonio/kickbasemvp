/**
 * Source-Registry — alle aktiven News-Quellen.
 *
 * Mock-Sources werden über NEWS_DISABLE_MOCKS=1 deaktiviert (sobald echte
 * Twitter/RSS-Source live ist).
 */

import type { NewsSource } from "../types";
import { buildClubRssSources, CLUB_RSS_FEEDS } from "./club-rss-source";
import { kickerSource } from "./kicker-rss-source";
import { buildMockReporterSources } from "./mock-twitter-source";

const MOCKS_DISABLED = process.env.NEWS_DISABLE_MOCKS === "1";

export const allSources: NewsSource[] = [
  ...buildClubRssSources(),
  kickerSource,
  ...(MOCKS_DISABLED ? [] : buildMockReporterSources()),
];

/** Map von clubSlug → Display-Name (für UI) */
export const CLUB_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  CLUB_RSS_FEEDS.map((f) => [f.slug, f.name])
);

export { kickerSource };
