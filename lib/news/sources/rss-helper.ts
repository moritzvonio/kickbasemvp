/**
 * Generic RSS-Parser-Helper.
 * Unterstützt klassisches RSS 2.0 (rss.channel.item) und Atom (feed.entry).
 */

import { XMLParser } from "fast-xml-parser";
import crypto from "node:crypto";
import type { RawNewsItem } from "../types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
});

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = "Ligabase/1.0 (+https://ligabase.de)";

interface RssRawItem {
  title?: string | { "#text"?: string };
  link?: string | { "@_href"?: string; "#text"?: string };
  guid?: string | { "#text"?: string };
  description?: string;
  summary?: string;
  content?: string;
  pubDate?: string;
  published?: string;
  updated?: string;
  enclosure?: { "@_url"?: string };
  "media:thumbnail"?: { "@_url"?: string };
  "media:content"?: { "@_url"?: string };
}

function readString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "#text" in v) {
    return String((v as { "#text"?: string })["#text"] ?? "");
  }
  return "";
}

function readLink(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const obj = v as { "@_href"?: string; "#text"?: string };
    return obj["@_href"] ?? obj["#text"] ?? "";
  }
  return "";
}

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function md5(s: string) {
  return crypto.createHash("md5").update(s).digest("hex");
}

export async function fetchRssFeed(
  url: string,
  sourceId: string,
  opts?: { maxItems?: number }
): Promise<RawNewsItem[]> {
  const max = opts?.maxItems ?? 30;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/rss+xml, application/atom+xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`RSS ${res.status} ${res.statusText} for ${url}`);
  }
  const xml = await res.text();
  const parsed = parser.parse(xml) as Record<string, unknown>;

  const rss = parsed.rss as { channel?: { item?: RssRawItem | RssRawItem[] } };
  const atom = parsed.feed as { entry?: RssRawItem | RssRawItem[] };
  const itemsRaw = rss?.channel?.item ?? atom?.entry ?? [];
  const items = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw];

  return items
    .slice(0, max)
    .map((item): RawNewsItem | null => {
      const title = stripHtml(readString(item.title));
      const link = readLink(item.link) || readString(item.guid);
      if (!title || !link) return null;

      const bodyRaw =
        readString(item.description) ||
        readString(item.summary) ||
        readString(item.content);
      const body = stripHtml(bodyRaw).slice(0, 280);

      const pubRaw = item.pubDate || item.published || item.updated;
      const publishedAt = pubRaw ? new Date(pubRaw) : new Date();
      if (isNaN(publishedAt.getTime())) {
        return null;
      }

      const imageUrl =
        item["media:thumbnail"]?.["@_url"] ??
        item["media:content"]?.["@_url"] ??
        item.enclosure?.["@_url"];

      return {
        externalId: md5(link),
        title,
        body,
        url: link,
        publishedAt,
        imageUrl,
        sourceId,
      };
    })
    .filter((x): x is RawNewsItem => x !== null);
}
