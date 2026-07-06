import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsSourceBadge } from "./news-source-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import type { TaggedNewsItem } from "@/lib/news/types";

export interface PlayerMeta {
  name: string;
  pim?: string;
  tid?: string;
}

export function NewsCard({
  item,
  playerNameMap,
  highlightPlayerIds,
  leagueId,
}: {
  item: TaggedNewsItem;
  /** playerId → Display-Name oder reichere PlayerMeta (Name + Bild + Team) */
  playerNameMap?: Record<string, string | PlayerMeta>;
  /** Spieler aus dem eigenen Squad – werden farblich hervorgehoben */
  highlightPlayerIds?: Set<string>;
  /** Wenn gesetzt → Player-Tags werden Links zur Spieler-Detail-Page (mit #news-Anchor) */
  leagueId?: string;
}) {
  const resolvePlayer = (id: string): PlayerMeta => {
    const v = playerNameMap?.[id];
    if (!v) return { name: id };
    if (typeof v === "string") return { name: v };
    return v;
  };
  const taggedPlayers = item.playerIds
    .map((id) => ({ id, ...resolvePlayer(id) }))
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
        {/* Avatar-Block: bevorzugt Spieler-Bilder (Stack), fallback auf Article-Image */}
        {taggedPlayers.length > 0 ? (
          <div className="flex-shrink-0 flex items-start">
            {taggedPlayers.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "rounded-lg overflow-hidden ring-2 ring-card",
                  i > 0 && "-ml-4"
                )}
                style={{ zIndex: 10 - i }}
                title={p.name}
              >
                <PlayerAvatar pim={p.pim} tid={p.tid} size={48} rounded="md" />
              </div>
            ))}
          </div>
        ) : (
          item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              className="h-12 w-12 flex-shrink-0 rounded-lg object-cover bg-muted"
              loading="lazy"
            />
          )
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
                const className = cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset transition-colors",
                  isMine
                    ? "bg-emerald-100 text-emerald-900 ring-emerald-300/60"
                    : "bg-muted text-foreground/80 ring-border",
                  leagueId && "hover:ring-primary/50 hover:bg-accent cursor-pointer"
                );
                if (leagueId) {
                  return (
                    <Link
                      key={p.id}
                      href={`/league/${leagueId}/spieler/${p.id}#news`}
                      className={className}
                      onClick={(e) => e.stopPropagation()}
                      title={`${p.name} – alle News + Spieler-Detail öffnen`}
                    >
                      {p.name}
                    </Link>
                  );
                }
                return (
                  <span key={p.id} className={className}>
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
