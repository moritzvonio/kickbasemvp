import { cn } from "@/lib/utils";

/**
 * Bundesliga ranking badge — shows where a player stands in the league-wide
 * Saisonpunkte ranking. Color tiers signal how elite the rank is.
 *
 * Tiers (Bundesliga has ~500 active players):
 *   Top 10  → gold "TOP 10"
 *   Top 25  → silver
 *   Top 50  → bronze
 *   Top 100 → muted
 *   else   → no badge
 */
export function RankBadge({
  rank,
  className,
}: {
  rank: number | undefined;
  className?: string;
}) {
  if (!rank || rank < 1) return null;

  let label: string;
  let color: string;

  if (rank <= 10) {
    label = `TOP 10`;
    color =
      "bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900 ring-amber-300/60";
  } else if (rank <= 25) {
    label = `TOP 25`;
    color = "bg-slate-200 text-slate-700 ring-slate-300";
  } else if (rank <= 50) {
    label = `TOP 50`;
    color = "bg-orange-100 text-orange-700 ring-orange-200";
  } else if (rank <= 100) {
    label = `TOP 100`;
    color = "bg-emerald-50 text-emerald-700 ring-emerald-200";
  } else {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ring-1 tabular shadow-sm",
        color,
        className
      )}
      title={`Rang #${rank} der Saison`}
    >
      {label}
    </span>
  );
}

/** Pure rank number indicator — for absolute placement display */
export function RankNumber({ rank }: { rank: number | undefined }) {
  if (!rank) return null;
  return (
    <span className="text-[10px] font-mono tabular text-muted-foreground">
      #{rank}
    </span>
  );
}
