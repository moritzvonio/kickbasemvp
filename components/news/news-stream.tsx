"use client";

import { useMemo, useState } from "react";
import { NewsCard, type PlayerMeta } from "./news-card";
import { NewsEmptyState } from "./news-empty-state";
import type { TaggedNewsItem } from "@/lib/news/types";

export type NewsFilter = "all" | "myteam" | "myclub" | "trends";

const FILTER_LABELS: Record<NewsFilter, string> = {
  all: "Alle",
  myteam: "Mein Team",
  myclub: "Mein Verein",
  trends: "Trends",
};

export function NewsStream({
  initialItems,
  myPlayerIds,
  myClubSlug,
  playerNameMap,
  showFilters = true,
  leagueId,
  defaultFilter,
}: {
  initialItems: TaggedNewsItem[];
  myPlayerIds?: string[];
  myClubSlug?: string;
  playerNameMap?: Record<string, string | PlayerMeta>;
  showFilters?: boolean;
  /** Wenn gesetzt: Player-Tags in Cards verlinken zur Spieler-Detail-Page */
  leagueId?: string;
  /** Default-Filter (sonst "all") */
  defaultFilter?: NewsFilter;
}) {
  // Default: wenn Squad-Spieler da sind → "myteam" prio, sonst "all"
  const initialFilter: NewsFilter =
    defaultFilter ?? (myPlayerIds && myPlayerIds.length > 0 ? "myteam" : "all");
  const [filter, setFilter] = useState<NewsFilter>(initialFilter);
  const myPlayerSet = useMemo(
    () => new Set(myPlayerIds ?? []),
    [myPlayerIds]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return initialItems;
    if (filter === "myteam") {
      return initialItems.filter((i) =>
        i.playerIds.some((pid) => myPlayerSet.has(pid))
      );
    }
    if (filter === "myclub" && myClubSlug) {
      return initialItems.filter((i) => i.clubSlug === myClubSlug);
    }
    if (filter === "trends") {
      const since = Date.now() - 24 * 60 * 60 * 1000;
      return initialItems
        .filter((i) => i.publishedAt.getTime() >= since && i.playerIds.length >= 2)
        .sort((a, b) => b.playerIds.length - a.playerIds.length);
    }
    return initialItems;
  }, [filter, initialItems, myPlayerSet, myClubSlug]);

  const filtersToShow: NewsFilter[] = ["all"];
  if (myPlayerIds && myPlayerIds.length > 0) filtersToShow.push("myteam");
  if (myClubSlug) filtersToShow.push("myclub");
  filtersToShow.push("trends");

  return (
    <div className="space-y-3">
      {showFilters && filtersToShow.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {filtersToShow.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-accent")
                }
              >
                {FILTER_LABELS[f]}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <NewsEmptyState
          title={
            filter === "myteam"
              ? "Aktuell keine News zu deinem Team"
              : filter === "myclub"
              ? "Aktuell keine News zu deinem Verein"
              : filter === "trends"
              ? "Aktuell keine Trend-News"
              : "Noch keine News"
          }
          description={
            filter === "all"
              ? "Quellen werden alle 30 Min neu eingelesen. Schau gleich nochmal vorbei."
              : "Wechsle den Filter um andere News zu sehen."
          }
        />
      ) : (
        filtered.map((item) => (
          <NewsCard
            key={item.externalId}
            item={item}
            playerNameMap={playerNameMap}
            highlightPlayerIds={myPlayerSet}
            leagueId={leagueId}
          />
        ))
      )}
    </div>
  );
}
