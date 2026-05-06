/**
 * PLATZHALTER für Reporter-/Twitter-News.
 *
 * Liefert ein JSON-Seed mit ~30 fiktiven Tweet-Beispielen ([MOCK-DEMO]
 * gekennzeichnet). Damit kann die UI ohne echten Twitter-Zugang gebaut
 * werden. Mourice ersetzt das später 1:1 durch:
 *   - RssAppTwitterSource ($20/Mo, rss.app als Twitter→RSS-Bridge)
 *   - oder TwitterApiSource ($100+/Mo, Twitter X API direkt)
 *
 * Interface bleibt gleich → ein-File-Replace.
 */

import type { NewsSource, RawNewsItem } from "../types";
import { MOCK_TWITTER_SEED, TRUSTED_REPORTERS } from "../seed-mock-data";

export function makeMockReporterSource(cfg: {
  handle: string;
  displayName: string;
  clubSlug?: string;
}): NewsSource {
  const sourceId = `reporter-${cfg.handle.toLowerCase()}`;
  return {
    id: sourceId,
    displayName: cfg.displayName,
    type: "reporter",
    clubSlug: cfg.clubSlug,
    intervalMinutes: 60,
    async fetch(): Promise<RawNewsItem[]> {
      const tweets = MOCK_TWITTER_SEED.filter((t) => t.handle === cfg.handle);
      return tweets.map((t): RawNewsItem => ({
        externalId: `mock-tw-${cfg.handle}-${t.id}`,
        title: t.text.slice(0, 120),
        body: t.text,
        url: `https://x.com/${cfg.handle}/status/${t.id}`,
        publishedAt: new Date(t.createdAt),
        imageUrl: t.imageUrl,
        sourceId,
      }));
    },
  };
}

export function buildMockReporterSources(): NewsSource[] {
  return TRUSTED_REPORTERS.map((r) =>
    makeMockReporterSource({ handle: r.handle, displayName: r.name })
  );
}
