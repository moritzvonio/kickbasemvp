/**
 * Spielername-Tagger via Regex (kostenlos, kein GPT).
 *
 * Strategie:
 *  1) Full-Name-Match (höchste Präzision, "vorname nachname")
 *  2) Surname-Match nur wenn Surname > 4 Zeichen UND eindeutig (1 Spieler)
 *  3) Word-Boundary-Check verhindert "Tah" → "Stahl"
 *
 * Edge-Cases (TODOs für GPT-Migration):
 *  - Kurze Namen (Kane, Sané, Tah) brauchen Vereins-Co-Mention für Präzision
 *  - Häufige Nachnamen (Müller, Schmidt) werden geskippt
 *  - Sonderzeichen (Müller, Özil) – UTF-8-lowercase-handling muss korrekt sein
 *
 * Migration-Hook: am Ende, wenn 0 Spieler gefunden UND OPENAI_API_KEY gesetzt,
 * könnte ein GPT-Fallback aktiviert werden (siehe TODO).
 */

import type { RawNewsItem, TaggedNewsItem, NewsSourceType } from "./types";
import { getPlayerIndex, type PlayerIndex } from "./player-index";

/** Source-Display-Daten – wird vom Aggregator gesetzt */
let SOURCE_REGISTRY: Map<
  string,
  { displayName: string; type: NewsSourceType; clubSlug?: string }
> = new Map();

export function registerSource(
  sourceId: string,
  displayName: string,
  type: NewsSourceType,
  clubSlug?: string
) {
  SOURCE_REGISTRY.set(sourceId, { displayName, type, clubSlug });
}

export function clearSourceRegistry() {
  SOURCE_REGISTRY = new Map();
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function tagItem(
  raw: RawNewsItem,
  preloadedIdx?: PlayerIndex
): Promise<TaggedNewsItem> {
  // Wenn Aggregator den Index schon geladen hat → nutzen, spart KV-Read pro Item
  const idx = preloadedIdx ?? (await getPlayerIndex());
  const text = `${raw.title} ${raw.body ?? ""}`.toLowerCase();
  const found = new Set<string>();

  // 1) Full-Name-Match
  for (const [fullname, playerId] of Object.entries(idx.byName)) {
    if (text.includes(fullname)) found.add(playerId);
  }

  // 2) Surname-Match – eindeutige Nachnamen mit ≥ 4 Zeichen
  // Bei mehrdeutigen Nachnamen: nur taggen wenn Vereins-Name auch im Text
  // (verhindert false positives: "Müller" beim FCB-Artikel = Thomas, beim
  // Eintracht-Artikel = anderer Müller).
  for (const [surname, playerIds] of Object.entries(idx.bySurname)) {
    if (surname.length < 4) continue;
    if (playerIds.length === 0) continue;
    const re = new RegExp(`\\b${escapeRegex(surname)}\\b`, "i");
    if (!re.test(text)) continue;
    if (playerIds.length === 1) {
      if (!found.has(playerIds[0])) found.add(playerIds[0]);
      continue;
    }
    // Mehrdeutig: filter auf Spieler dessen Verein im Text genannt wird
    for (const pid of playerIds) {
      if (found.has(pid)) continue;
      const meta = idx.byPlayerId[pid];
      if (!meta) continue;
      if (
        meta.clubSlug &&
        text.includes(meta.clubSlug.toLowerCase())
      ) {
        found.add(pid);
        break; // höchstens 1 Spieler pro mehrdeutigem Nachnamen
      }
    }
  }

  const playerIds = [...found];
  const sourceMeta = SOURCE_REGISTRY.get(raw.sourceId);

  // Club-Slug: bevorzugt von der Source, fallback aus dem ersten getaggten Spieler
  let clubSlug = sourceMeta?.clubSlug;
  if (!clubSlug && playerIds[0]) {
    clubSlug = idx.byPlayerId[playerIds[0]]?.clubSlug;
  }

  // PLATZHALTER für GPT-Fallback (Mourice aktiviert später)
  // if (found.size === 0 && process.env.OPENAI_API_KEY) {
  //   const llmTags = await tagViaGpt(text, idx);
  //   ...
  // }

  return {
    ...raw,
    playerIds,
    clubSlug,
    sourceDisplayName: sourceMeta?.displayName ?? raw.sourceId,
    sourceType: sourceMeta?.type ?? "media",
  };
}
