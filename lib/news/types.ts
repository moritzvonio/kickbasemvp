/**
 * News-Layer Types – Pluggable Source Interface.
 *
 * Jede News-Quelle implementiert das gleiche Interface. Heute liefert die
 * MockTwitterSource einen JSON-Seed, später wird sie durch RssAppTwitterSource
 * oder TwitterApiSource ersetzt – ohne irgendwo anders Code zu ändern.
 */

export interface NewsSource {
  /** Eindeutiger Source-Slug, z.B. "fcb-official", "plettenberg" */
  id: string;
  /** Anzeigename, z.B. "FC Bayern (offiziell)" */
  displayName: string;
  /** Source-Type für UI-Icons + Filter */
  type: NewsSourceType;
  /** Verein-Slug (Bundesliga-Team) für Filterung – optional */
  clubSlug?: string;
  /** Polling-Interval in Minuten (für Cron-Scheduler) */
  intervalMinutes: number;
  /** Holt aktuelle News-Items von dieser Quelle */
  fetch(): Promise<RawNewsItem[]>;
}

export type NewsSourceType = "club" | "reporter" | "media" | "community";

export interface RawNewsItem {
  /** Stable ID – meist URL-Hash oder Tweet-ID */
  externalId: string;
  /** Headline / Tweet-Text */
  title: string;
  /** Optionaler längerer Text (max 280 Zeichen, Pressespiegel-Recht §87f UrhG) */
  body?: string;
  /** Original-URL (Pflicht – Quellenangabe) */
  url: string;
  /** Erscheinungs-Zeitpunkt */
  publishedAt: Date;
  /** Image-URL falls vorhanden */
  imageUrl?: string;
  /** Source-ID die das gefetched hat */
  sourceId: string;
}

export interface TaggedNewsItem extends RawNewsItem {
  /** Erkannte Spieler-IDs (Kickbase-IDs) */
  playerIds: string[];
  /** Erkannter Verein-Slug (von Source oder via Tagger) */
  clubSlug?: string;
  /** Source-Display-Daten denormalisiert für UI */
  sourceDisplayName: string;
  sourceType: NewsSourceType;
}

/** Storage-Variante mit ISO-Date-Strings (KV-serialization-friendly) */
export interface StoredNewsItem
  extends Omit<TaggedNewsItem, "publishedAt"> {
  publishedAt: string;
}

export function toStored(item: TaggedNewsItem): StoredNewsItem {
  return { ...item, publishedAt: item.publishedAt.toISOString() };
}

export function fromStored(item: StoredNewsItem): TaggedNewsItem {
  return { ...item, publishedAt: new Date(item.publishedAt) };
}
