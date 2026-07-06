/**
 * Player-Index für den News-Tagger.
 *
 * Hält eine Map aller aktiven Bundesliga-Spieler (Vorname + Nachname → ID).
 * Wird im KV gecached für 25h. Refresh kann durch authenticated User
 * (über /api/news/refresh-player-index) oder den Cron getriggert werden,
 * wenn ein Service-Token verfügbar ist.
 *
 * Fallback: wenn kein Index in KV verfügbar, läuft der Tagger leer (keine
 * Spieler-Tags) — News werden trotzdem nach Club gespeichert wenn Source
 * einen clubSlug liefert.
 */

import { kv as vercelKv } from "@vercel/kv";
import { kb } from "@/lib/kickbase/api";
import { teamMeta } from "@/lib/kickbase/types";

export interface PlayerIndex {
  /** Spielername (lowercase, "vorname nachname") → playerId */
  byName: Record<string, string>;
  /** Nachname (lowercase) → [playerIds] */
  bySurname: Record<string, string[]>;
  /** playerId → Display-Name + Club-Slug + Spielerbild (für News-Cards) */
  byPlayerId: Record<
    string,
    {
      name: string;
      firstName: string;
      lastName: string;
      clubSlug: string;
      /** Player-Image-Path (für PlayerAvatar) */
      pim?: string;
      /** Team-ID für Team-Logo-Fallback */
      tid?: string;
    }
  >;
  refreshedAt: string;
  count: number;
}

const KV_AVAILABLE = !!(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

const CACHE_KEY = "news:playerindex";
const CACHE_TTL_SECONDS = 25 * 60 * 60;

let memoryCache: PlayerIndex | null = null;

const EMPTY_INDEX: PlayerIndex = {
  byName: {},
  bySurname: {},
  byPlayerId: {},
  refreshedAt: new Date(0).toISOString(),
  count: 0,
};

/**
 * Liefert den aktuellen Player-Index aus dem Cache. Wenn kein Index da
 * ist, returns EMPTY_INDEX (leerer Index — Tagger findet keine Spieler).
 */
export async function getPlayerIndex(): Promise<PlayerIndex> {
  if (KV_AVAILABLE) {
    const cached = await vercelKv.get<PlayerIndex>(CACHE_KEY);
    if (cached) return cached;
    return EMPTY_INDEX;
  }
  return memoryCache ?? EMPTY_INDEX;
}

/**
 * Erzeugt den Player-Index aus der Kickbase-API. Braucht einen
 * authenticated Token (vom User oder Service-Account). Speichert
 * in KV und lokalem Memory-Cache.
 *
 * Returns refreshten Index.
 */
export async function rebuildPlayerIndex(token: string): Promise<PlayerIndex> {
  const all: Array<{
    pi: string;
    n: string;
    fn?: string;
    tid: string;
    pos: number;
    pim?: string;
  }> = [];

  // Vollständiger Pool via Team-Sweep (alle Vereinskader) — die alten
  // per-Position-Abfragen kappten bei ~25 Spielern pro Position.
  try {
    const res = await kb.competitionPlayersAll(token, "1");
    for (const p of res.it ?? []) {
      all.push(p);
    }
  } catch (e) {
    console.warn(`[player-index] competitionPlayersAll failed:`, e);
  }

  const byName: PlayerIndex["byName"] = {};
  const bySurname: PlayerIndex["bySurname"] = {};
  const byPlayerId: PlayerIndex["byPlayerId"] = {};

  for (const p of all) {
    const lastName = p.n;
    const firstName = p.fn ?? "";
    const clubMeta = teamMeta(p.tid);
    const clubSlug = (clubMeta.short ?? p.tid).toLowerCase();
    const fullName = (firstName ? `${firstName} ${lastName}` : lastName)
      .trim()
      .toLowerCase();

    if (firstName) byName[fullName] = p.pi;

    const surname = lastName.toLowerCase();
    if (!bySurname[surname]) bySurname[surname] = [];
    if (!bySurname[surname].includes(p.pi)) {
      bySurname[surname].push(p.pi);
    }

    byPlayerId[p.pi] = {
      name: firstName ? `${firstName} ${lastName}` : lastName,
      firstName,
      lastName,
      clubSlug,
      pim: p.pim,
      tid: p.tid,
    };
  }

  const idx: PlayerIndex = {
    byName,
    bySurname,
    byPlayerId,
    refreshedAt: new Date().toISOString(),
    count: all.length,
  };

  if (KV_AVAILABLE) {
    await vercelKv.set(CACHE_KEY, idx, { ex: CACHE_TTL_SECONDS });
  } else {
    memoryCache = idx;
  }

  return idx;
}

/** Index ist veraltet (> 24h) oder leer */
export function isIndexStale(idx: PlayerIndex): boolean {
  if (idx.count === 0) return true;
  const ageMs = Date.now() - new Date(idx.refreshedAt).getTime();
  return ageMs > 24 * 60 * 60 * 1000;
}

/**
 * Liefert einen frischen Index — mit Service-Account-Selbstheilung:
 * Ist der gecachte Index leer/stale und KICKBASE_EMAIL/KICKBASE_PASSWORD
 * sind gesetzt (Vercel-Env), loggt sich der Aufrufer (typisch der
 * News-Cron) selbst bei Kickbase ein und rebuildet den Index.
 * Ohne Service-Account oder bei Login-Fehlern: Fallback auf den
 * Cache-Stand (Tagger läuft dann ggf. ohne Spieler-Tags weiter).
 *
 * Login passiert nur wenn stale (~1× pro Tag), nicht bei jedem Cron-Run.
 */
export async function ensureFreshPlayerIndex(): Promise<PlayerIndex> {
  const idx = await getPlayerIndex();
  if (!isIndexStale(idx)) return idx;

  const em = process.env.KICKBASE_EMAIL;
  const pass = process.env.KICKBASE_PASSWORD;
  if (!em || !pass) {
    if (idx.count === 0) {
      console.warn(
        "[player-index] Index leer/stale und kein Service-Account (KICKBASE_EMAIL/KICKBASE_PASSWORD) konfiguriert — Tagger läuft ohne Spieler-Tags"
      );
    }
    return idx;
  }

  try {
    const login = await kb.login({ em, pass });
    const token = login.token ?? login.tkn;
    if (!token) {
      console.warn("[player-index] Service-Login ohne Token-Response");
      return idx;
    }
    const fresh = await rebuildPlayerIndex(token);
    console.log(`[player-index] Service-Rebuild ok: ${fresh.count} Spieler`);
    return fresh;
  } catch (e) {
    console.warn("[player-index] Service-Login/Rebuild fehlgeschlagen:", e);
    return idx;
  }
}
