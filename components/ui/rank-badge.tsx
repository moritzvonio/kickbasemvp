import { cn } from "@/lib/utils";

/**
 * Medal-style rank badge — shows the player's actual Bundesliga ranking
 * with a tier-colored medallion background.
 *
 * Tiers (Bundesliga ~500 active players):
 *   Top 5   → 💎 Diamant (cyan-blue gradient)
 *   Top 25  → 🥇 Gold (amber gradient)
 *   Top 50  → 🥈 Silber (slate gradient)
 *   Top 100 → 🥉 Bronze (orange/copper gradient)
 *   else    → no badge
 */
export function RankBadge({
  rank,
  total,
  className,
  size = "md",
}: {
  rank: number | undefined;
  /** Optional: Gesamtanzahl Bundesliga-Spieler für "X / Total"-Anzeige */
  total?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (!rank || rank < 1 || rank > 100) return null;
  const tier = tierFor(rank);

  const sizing = {
    sm: { box: "h-5 px-1.5 text-[10px]", icon: "size-3" },
    md: { box: "h-6 px-2 text-xs", icon: "size-3.5" },
    lg: { box: "h-7 px-2.5 text-sm", icon: "size-4" },
  }[size];

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1 rounded-full font-bold tracking-wide tabular ring-1 shadow-sm overflow-hidden",
        sizing.box,
        tier.classes,
        className
      )}
      title={
        total
          ? `Platz ${rank} von ${total} in der Bundesliga-Saisonwertung`
          : `Platz ${rank} der Bundesliga-Saisonwertung`
      }
    >
      <span
        aria-hidden
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(255,255,255,0.7), transparent 60%)",
        }}
      />
      <span className="relative z-10 leading-none flex-shrink-0">{tier.emoji}</span>
      <span className="relative z-10 leading-none">
        #{rank}
        {total && (
          <span className="opacity-70 font-normal ml-0.5">/{total}</span>
        )}
      </span>
    </span>
  );
}

function tierFor(rank: number) {
  if (rank <= 5) {
    return {
      label: "Diamant",
      emoji: "💎",
      classes:
        "bg-gradient-to-br from-cyan-200 via-sky-100 to-cyan-300 text-cyan-900 ring-cyan-400/60",
    };
  }
  if (rank <= 25) {
    return {
      label: "Gold",
      emoji: "🥇",
      classes:
        "bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-400 text-amber-900 ring-amber-400/60",
    };
  }
  if (rank <= 50) {
    return {
      label: "Silber",
      emoji: "🥈",
      classes:
        "bg-gradient-to-br from-slate-200 via-zinc-100 to-slate-300 text-slate-700 ring-slate-300/70",
    };
  }
  return {
    label: "Bronze",
    emoji: "🥉",
    classes:
      "bg-gradient-to-br from-orange-200 via-amber-100 to-orange-400 text-orange-900 ring-orange-400/60",
  };
}

/** Pure rank number (for inline use, e.g. position rank) */
export function RankNumber({
  rank,
  total,
}: {
  rank: number | undefined;
  total?: number;
}) {
  if (!rank) return null;
  return (
    <span
      className="text-[10px] font-mono tabular text-muted-foreground"
      title={total ? `Rang ${rank} von ${total}` : undefined}
    >
      #{rank}
      {total && (
        <span className="opacity-60">/{total}</span>
      )}
    </span>
  );
}
