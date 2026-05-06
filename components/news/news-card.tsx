import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsSourceBadge } from "./news-source-badge";
import type { TaggedNewsItem } from "@/lib/news/types";

export function NewsCard({
  item,
  playerNameMap,
  highlightPlayerIds,
}: {
  item: TaggedNewsItem;
  /** playerId → Display-Name */
  playerNameMap?: Record<string, string>;
  /** Spieler aus dem eigenen Squad — werden farblich hervorgehoben */
  highlightPlayerIds?: Set<string>;
}) {
  const taggedPlayers = item.playerIds
    .map((id) => ({ id, name: playerNameMap?.[id] ?? id }))
    .filter((p) => p.name && p.name !== p.id);

  const time = (() => {
    try {
      return formatDistanceToNow(item.publishedAt, {
        addSuffix: true,
        locale: de,
      });
    } catch {
      return "";
    }
  })();

  return (
    <article className="group rounded-xl border border-border bg-card p-3.5 hover:bg-accent/50 transition-colors">
      <div className="flex gap-3">
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="h-16 w-16 flex-shrink-0 rounded-lg object-cover bg-muted"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1.5 flex-wrap">
            <NewsSourceBadge type={item.sourceType} name={item.sourceDisplayName} />
            {time && (
              <>
                <span>·</span>
                <time dateTime={item.publishedAt.toISOString()}>{time}</time>
              </>
            )}
          </div>
          <h3 className="font-semibold text-sm leading-snug mb-1.5 line-clamp-2">
            {item.title}
          </h3>
          {item.body && item.body !== item.title && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {item.body}
            </p>
          )}
          {taggedPlayers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {taggedPlayers.slice(0, 4).map((p) => {
                const isMine = highlightPlayerIds?.has(p.id);
                return (
                  <span
                    key={p.id}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                      isMine
                        ? "bg-emerald-100 text-emerald-900 ring-emerald-300/60"
                        : "bg-muted text-foreground/80 ring-border"
                    )}
                  >
                    {p.name}
                  </span>
                );
              })}
              {taggedPlayers.length > 4 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{taggedPlayers.length - 4} mehr
                </span>
              )}
            </div>
          )}
        </div>
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground hover:text-primary self-start inline-flex items-center gap-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          Quelle
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </article>
  );
}
