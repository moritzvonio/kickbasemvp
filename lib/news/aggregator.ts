/**
 * News-Aggregator — Orchestriert Fetch, Tag und Store für alle Quellen.
 *
 * Wird vom Cron-Endpoint aufgerufen.
 */

import { allSources } from "./sources";
import { tagItem, registerSource } from "./tagger";
import { storeIfNew, recordFetch } from "./store";

export interface AggregateResult {
  fetched: number;
  stored: number;
  errors: Array<{ sourceId: string; error: string }>;
  durationMs: number;
}

/** Source-Registry für den Tagger füllen */
function syncSourceRegistry() {
  for (const s of allSources) {
    registerSource(s.id, s.displayName, s.type, s.clubSlug);
  }
}

export async function refreshAllSources(): Promise<AggregateResult> {
  const start = Date.now();
  syncSourceRegistry();

  let fetched = 0;
  let stored = 0;
  const errors: AggregateResult["errors"] = [];

  // Sources parallel fetchen, aber sequentiell speichern (KV-Rate-Limit)
  const fetchResults = await Promise.allSettled(
    allSources.map((src) => src.fetch())
  );

  for (let i = 0; i < allSources.length; i++) {
    const src = allSources[i];
    const result = fetchResults[i];
    if (result.status === "rejected") {
      const msg =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      errors.push({ sourceId: src.id, error: msg });
      await recordFetch(src.id, "error", msg);
      continue;
    }
    const raws = result.value;
    fetched += raws.length;
    for (const raw of raws) {
      try {
        const tagged = await tagItem(raw);
        const wasStored = await storeIfNew(tagged);
        if (wasStored) stored++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "store-failed";
        errors.push({ sourceId: src.id, error: msg });
      }
    }
    await recordFetch(src.id, "ok");
  }

  return {
    fetched,
    stored,
    errors,
    durationMs: Date.now() - start,
  };
}
