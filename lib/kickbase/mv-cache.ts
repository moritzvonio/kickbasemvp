/**
 * Marktwert-History-Cache.
 *
 * Die Reconstruction des Netto-Teamwert-Verlaufs braucht die MV-History
 * JEDES je-besessenen Spielers (~150-300 Spieler pro Liga). Ungecacht wären
 * das 150-300 Kickbase-Calls pro Seitenaufruf → 15-25 s. Marktwerte sind
 * global (pro Competition, nicht pro Liga) und ändern sich nur 1×/Tag, daher
 * cachen wir sie in Vercel KV (Key nur per playerId) mit 12 h TTL.
 *
 * Fallback ohne KV: In-Memory-Cache (überlebt nur den Prozess).
 */
import { kv as vercelKv } from "@vercel/kv";
import { kb } from "./api";
import type { KbMarketValuePoint } from "./types";

const KV_AVAILABLE = !!(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);
const TTL_SECONDS = 12 * 60 * 60;
const MV_DAYS = 365;

const mem = new Map<string, { exp: number; pts: KbMarketValuePoint[] }>();
const key = (playerId: string) => `mv:hist:${playerId}`;

async function getOne(
  token: string,
  leagueId: string,
  playerId: string
): Promise<KbMarketValuePoint[]> {
  const now = Date.now();
  const m = mem.get(playerId);
  if (m && m.exp > now) return m.pts;

  if (KV_AVAILABLE) {
    try {
      const cached = await vercelKv.get<KbMarketValuePoint[]>(key(playerId));
      if (Array.isArray(cached)) {
        mem.set(playerId, { exp: now + TTL_SECONDS * 1000, pts: cached });
        return cached;
      }
    } catch {
      /* KV-Miss → fetch */
    }
  }

  const hist = await kb
    .marketValue(token, leagueId, playerId, MV_DAYS)
    .catch(() => null);
  const pts = hist?.it ?? [];
  mem.set(playerId, { exp: now + TTL_SECONDS * 1000, pts });
  if (KV_AVAILABLE && pts.length) {
    try {
      await vercelKv.set(key(playerId), pts, { ex: TTL_SECONDS });
    } catch {
      /* best-effort */
    }
  }
  return pts;
}

/** Holt MV-Historien für viele Spieler (gecacht, begrenzte Parallelität). */
export async function getMarketValueHistories(
  token: string,
  leagueId: string,
  playerIds: string[],
  concurrency = 16
): Promise<Map<string, KbMarketValuePoint[]>> {
  const out = new Map<string, KbMarketValuePoint[]>();
  const ids = [...new Set(playerIds)];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, ids.length) }, async () => {
      while (i < ids.length) {
        const pid = ids[i++];
        out.set(pid, await getOne(token, leagueId, pid));
      }
    })
  );
  return out;
}
