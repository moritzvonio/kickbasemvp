/**
 * Lokales News-Pipeline-Test-Script.
 *
 * Lauft alle Sources einmal durch, taggt, speichert. Für Dev-Tests ohne
 * den GitHub-Action-Cron auswarten zu müssen.
 *
 * Usage:
 *   npx tsx scripts/test-news-pipeline.ts
 *
 * Voraussetzung: .env.local muss SESSION_SECRET enthalten (für env-Validierung).
 * KV ist optional — ohne KV läuft alles im In-Memory-Mode.
 */

/* eslint-disable no-console */

import { refreshAllSources } from "../lib/news/aggregator";
import { allSources } from "../lib/news/sources";
import {
  getRecentNews,
  getFetchStatus,
  NEWS_STORE_BACKEND,
} from "../lib/news/store";

async function main() {
  console.log("\n[news-pipeline] Starting test run");
  console.log(`  Backend: ${NEWS_STORE_BACKEND}`);
  console.log(`  Sources: ${allSources.length} configured`);
  for (const s of allSources) {
    console.log(`    - ${s.id} (${s.type}) every ${s.intervalMinutes} min`);
  }

  console.log("\n[news-pipeline] Running refreshAllSources()...");
  const result = await refreshAllSources();

  console.log("\n[news-pipeline] === RESULT ===");
  console.log(`  Fetched:   ${result.fetched}`);
  console.log(`  Stored:    ${result.stored}`);
  console.log(`  Duration:  ${result.durationMs}ms`);
  console.log(`  Errors:    ${result.errors.length}`);
  for (const e of result.errors) {
    console.log(`    ! ${e.sourceId}: ${e.error}`);
  }

  console.log("\n[news-pipeline] Per-Source-Status:");
  for (const s of allSources) {
    const st = await getFetchStatus(s.id);
    if (st) {
      const symbol = st.status === "ok" ? "✅" : "❌";
      console.log(`  ${symbol} ${s.id} (${st.ts.slice(0, 19)})`);
      if (st.err) console.log(`     ${st.err}`);
    } else {
      console.log(`  ⏳ ${s.id} (no status)`);
    }
  }

  console.log("\n[news-pipeline] Top 10 stored items:");
  const items = await getRecentNews({ limit: 10 });
  for (const item of items) {
    const playerTag =
      item.playerIds.length > 0 ? `[${item.playerIds.length}p]` : "";
    const clubTag = item.clubSlug ? `[${item.clubSlug}]` : "";
    console.log(
      `  • ${item.title.slice(0, 70)} ${playerTag}${clubTag}\n    ${item.sourceDisplayName} · ${item.publishedAt.toISOString().slice(0, 16)}`
    );
  }
  console.log(
    `\n[news-pipeline] ${items.length} items recently stored. Done.\n`
  );
}

main().catch((e) => {
  console.error("[news-pipeline] FATAL", e);
  process.exit(1);
});
