/**
 * News-Storage-Layer.
 *
 * Standard: Vercel KV / Upstash Redis (REST API). Wenn KV-Env nicht
 * konfiguriert ist (lokales Dev ohne Setup), fällt der Layer auf einen
 * In-Memory-Store zurück. So kann der News-Layer ohne Mourice-KV-Setup
 * lokal getestet werden.
 *
 * KV-Schema:
 *   news:item:{externalId}      → StoredNewsItem (TTL 30 Tage)
 *   news:bytime                  → Sorted Set, member=externalId, score=publishedAt-ms
 *   news:byplayer:{playerId}     → Sorted Set, member=externalId, score=publishedAt-ms
 *   news:byclub:{clubSlug}       → Sorted Set, member=externalId, score=publishedAt-ms
 *   news:lastfetch:{sourceId}    → ISO timestamp letzte erfolgreiche Fetch
 */

import { kv as vercelKv } from "@vercel/kv";
import type { StoredNewsItem, TaggedNewsItem } from "./types";
import { fromStored, toStored } from "./types";

const ITEM_TTL_DAYS = 30;
const ITEM_TTL_SECONDS = ITEM_TTL_DAYS * 24 * 60 * 60;
const MIN_TITLE_LENGTH = 10;
const MAX_AGE_DAYS = 14;

const BLOCKLIST_PHRASES = [
  "newsletter abonnieren",
  "anzeige",
  "werbung",
  "jetzt abonnieren",
  "cookies akzeptieren",
];

/**
 * KV-Verfügbarkeit prüfen. Vercel KV setzt KV_REST_API_URL automatisch
 * wenn ein Storage-Integration aktiv ist. Beim lokalen Dev ohne KV
 * fallen wir auf Memory zurück.
 */
const KV_AVAILABLE = !!(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

// In-Memory-Fallback für lokales Dev
const memStore = {
  items: new Map<string, StoredNewsItem>(),
  byTime: [] as Array<{ id: string; score: number }>,
  byPlayer: new Map<string, Array<{ id: string; score: number }>>(),
  byClub: new Map<string, Array<{ id: string; score: number }>>(),
  lastFetch: new Map<string, { ts: string; status: string; err?: string }>(),
};

function memInsertSorted(
  arr: Array<{ id: string; score: number }>,
  entry: { id: string; score: number }
) {
  arr.push(entry);
  arr.sort((a, b) => b.score - a.score);
}

/** Items-Key per externalId */
function itemKey(externalId: string) {
  return `news:item:${externalId}`;
}
function byPlayerKey(playerId: string) {
  return `news:byplayer:${playerId}`;
}
function byClubKey(clubSlug: string) {
  return `news:byclub:${clubSlug}`;
}
function lastFetchKey(sourceId: string) {
  return `news:lastfetch:${sourceId}`;
}

/**
 * Speichert ein News-Item, wenn es noch nicht existiert und die
 * Qualitäts-Filter passt. Returns true wenn neu gespeichert.
 */
export async function storeIfNew(item: TaggedNewsItem): Promise<boolean> {
  // Quality gates
  if (item.title.length < MIN_TITLE_LENGTH) return false;
  const ageDays =
    (Date.now() - item.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > MAX_AGE_DAYS) return false;
  const text = `${item.title} ${item.body ?? ""}`.toLowerCase();
  for (const phrase of BLOCKLIST_PHRASES) {
    if (text.includes(phrase)) return false;
  }
  // Items ohne Player- UND Club-Tag → uninteressant
  if (item.playerIds.length === 0 && !item.clubSlug) return false;

  const stored = toStored(item);
  const score = item.publishedAt.getTime();

  if (!KV_AVAILABLE) {
    if (memStore.items.has(item.externalId)) return false;
    memStore.items.set(item.externalId, stored);
    memInsertSorted(memStore.byTime, { id: item.externalId, score });
    for (const pid of item.playerIds) {
      const arr = memStore.byPlayer.get(pid) ?? [];
      memInsertSorted(arr, { id: item.externalId, score });
      memStore.byPlayer.set(pid, arr);
    }
    if (item.clubSlug) {
      const arr = memStore.byClub.get(item.clubSlug) ?? [];
      memInsertSorted(arr, { id: item.externalId, score });
      memStore.byClub.set(item.clubSlug, arr);
    }
    return true;
  }

  // KV-Path
  // Dedup-Check via SET NX (only if not exists)
  const setRes = await vercelKv.set(itemKey(item.externalId), stored, {
    ex: ITEM_TTL_SECONDS,
    nx: true,
  });
  if (setRes !== "OK") return false;

  await vercelKv.zadd("news:bytime", { score, member: item.externalId });
  for (const pid of item.playerIds) {
    await vercelKv.zadd(byPlayerKey(pid), { score, member: item.externalId });
  }
  if (item.clubSlug) {
    await vercelKv.zadd(byClubKey(item.clubSlug), {
      score,
      member: item.externalId,
    });
  }
  return true;
}

/** Recent News (chronologisch, neueste zuerst) */
export async function getRecentNews(opts?: {
  limit?: number;
}): Promise<TaggedNewsItem[]> {
  const limit = opts?.limit ?? 50;
  if (!KV_AVAILABLE) {
    const ids = memStore.byTime.slice(0, limit).map((e) => e.id);
    return ids
      .map((id) => memStore.items.get(id))
      .filter((x): x is StoredNewsItem => !!x)
      .map(fromStored);
  }
  const ids = (await vercelKv.zrange("news:bytime", 0, limit - 1, {
    rev: true,
  })) as string[];
  if (!ids.length) return [];
  return loadByIds(ids);
}

/** News für eine Liste von Player-IDs (Union, dedupliziert, sortiert) */
export async function getRecentNewsForPlayers(
  playerIds: string[],
  opts?: { limit?: number }
): Promise<TaggedNewsItem[]> {
  const limit = opts?.limit ?? 50;
  if (!playerIds.length) return [];

  if (!KV_AVAILABLE) {
    const dedup = new Map<string, number>();
    for (const pid of playerIds) {
      const arr = memStore.byPlayer.get(pid) ?? [];
      for (const e of arr) {
        if (!dedup.has(e.id) || (dedup.get(e.id) ?? 0) < e.score) {
          dedup.set(e.id, e.score);
        }
      }
    }
    const ids = Array.from(dedup.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map((e) => e[0]);
    return ids
      .map((id) => memStore.items.get(id))
      .filter((x): x is StoredNewsItem => !!x)
      .map(fromStored);
  }

  // KV-Path: zrange für jeden Player, dedup + sort in JS
  const dedup = new Map<string, number>();
  for (const pid of playerIds) {
    const items = (await vercelKv.zrange(byPlayerKey(pid), 0, 100, {
      rev: true,
      withScores: true,
    })) as Array<string | number>;
    for (let i = 0; i < items.length; i += 2) {
      const id = items[i] as string;
      const score = items[i + 1] as number;
      if (!dedup.has(id) || (dedup.get(id) ?? 0) < score) {
        dedup.set(id, score);
      }
    }
  }
  const ids = Array.from(dedup.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map((e) => e[0]);
  return loadByIds(ids);
}

/** News für einen einzelnen Spieler */
export async function getRecentNewsForPlayer(
  playerId: string,
  opts?: { limit?: number }
): Promise<TaggedNewsItem[]> {
  return getRecentNewsForPlayers([playerId], opts);
}

/** News für einen Verein (Club-Slug) */
export async function getRecentNewsForClub(
  clubSlug: string,
  opts?: { limit?: number }
): Promise<TaggedNewsItem[]> {
  const limit = opts?.limit ?? 50;
  if (!KV_AVAILABLE) {
    const arr = memStore.byClub.get(clubSlug) ?? [];
    const ids = arr.slice(0, limit).map((e) => e.id);
    return ids
      .map((id) => memStore.items.get(id))
      .filter((x): x is StoredNewsItem => !!x)
      .map(fromStored);
  }
  const ids = (await vercelKv.zrange(byClubKey(clubSlug), 0, limit - 1, {
    rev: true,
  })) as string[];
  if (!ids.length) return [];
  return loadByIds(ids);
}

async function loadByIds(ids: string[]): Promise<TaggedNewsItem[]> {
  const stored = (await Promise.all(
    ids.map((id) => vercelKv.get<StoredNewsItem>(itemKey(id)))
  )) as Array<StoredNewsItem | null>;
  return stored.filter((x): x is StoredNewsItem => !!x).map(fromStored);
}

/** Source-Status nach Fetch protokollieren */
export async function recordFetch(
  sourceId: string,
  status: "ok" | "error",
  err?: string
): Promise<void> {
  const entry = { ts: new Date().toISOString(), status, err };
  if (!KV_AVAILABLE) {
    memStore.lastFetch.set(sourceId, entry);
    return;
  }
  await vercelKv.set(lastFetchKey(sourceId), entry, { ex: 7 * 24 * 60 * 60 });
}

export async function getFetchStatus(sourceId: string) {
  if (!KV_AVAILABLE) return memStore.lastFetch.get(sourceId) ?? null;
  return await vercelKv.get<{ ts: string; status: string; err?: string }>(
    lastFetchKey(sourceId)
  );
}

export const NEWS_STORE_BACKEND = KV_AVAILABLE ? "kv" : "memory";
