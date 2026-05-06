/**
 * News-Aggregator — Orchestriert Fetch, Tag und Store für alle Quellen.
 *
 * Performance-Optimierungen für Vercel-Hobby-60s-Function-Limit:
 *  - Player-Index EINMAL pro Run laden (nicht pro Item)
 *  - Items in parallelen Batches speichern (concurrency-limit gegen KV-Rate)
 *  - Sources parallel fetchen via Promise.allSettled
 */

import { allSources } from "./sources";
import { tagItem, registerSource } from "./tagger";
import { storeIfNew, recordFetch } from "./store";
import { getPlayerIndex } from "./player-index";

export interface AggregateResult {
  fetched: number;
  stored: number;
  errors: Array<{ sourceId: string; error: string }>;
  durationMs: number;
}

const STORAGE_CONCURRENCY = 8;

/** Source-Registry für den Tagger füllen */
function syncSourceRegistry() {
  for (const s of allSources) {
    registerSource(s.id, s.displayName, s.type, s.clubSlug);
  }
}

/** Promise-Pool: führt async-Fn auf items in Batches mit limit aus */
async function processInBatches<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export async function refreshAllSources(): Promise<AggregateResult> {
  const start = Date.now();
  syncSourceRegistry();

  // Player-Index EINMAL laden (statt pro Item)
  const idx = await getPlayerIndex();

  let fetched = 0;
  let stored = 0;
  const errors: AggregateResult["errors"] = [];

  // Alle Sources parallel fetchen
  const fetchResults = await Promise.allSettled(
    allSources.map((src) => src.fetch())
  );

  // Per-Source-Status protokollieren (parallel)
  await Promise.all(
    allSources.map((src, i) => {
      const result = fetchResults[i];
      if (result.status === "rejected") {
        const msg =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        errors.push({ sourceId: src.id, error: msg });
        return recordFetch(src.id, "error", msg);
      }
      return recordFetch(src.id, "ok");
    })
  );

  // Alle erfolgreich gefetchten Items zu einer Liste flatten
  const allRaws: Array<{ raw: import("./types").RawNewsItem; sourceId: string }> = [];
  for (let i = 0; i < allSources.length; i++) {
    const result = fetchResults[i];
    if (result.status === "fulfilled") {
      for (const raw of result.value) {
        allRaws.push({ raw, sourceId: allSources[i].id });
      }
    }
  }
  fetched = allRaws.length;

  // Tag + Store parallel in Batches (mit preloaded index)
  const stored_results = await processInBatches(
    allRaws,
    STORAGE_CONCURRENCY,
    async ({ raw, sourceId }) => {
      try {
        const tagged = await tagItem(raw, idx);
        return await storeIfNew(tagged);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "store-failed";
        errors.push({ sourceId, error: msg });
        return false;
      }
    }
  );
  stored = stored_results.filter(Boolean).length;

  return {
    fetched,
    stored,
    errors,
    durationMs: Date.now() - start,
  };
}
