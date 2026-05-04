import { cn } from "@/lib/utils";

/**
 * Horizontal performance bar.
 * Shows points filled relative to max — color tier indicates "hotness".
 */
export function PointBar({
  value,
  max,
  className,
  width = 100,
  height = 8,
}: {
  value: number | undefined;
  max: number;
  className?: string;
  width?: number;
  height?: number;
}) {
  if (!value || max <= 0) {
    return (
      <span
        className={cn("inline-block bg-muted rounded-full opacity-50", className)}
        style={{ width, height }}
        aria-label="Keine Punkte"
      />
    );
  }
  const pct = Math.min(1, value / max);
  const tier = pct >= 0.75 ? "good" : pct >= 0.4 ? "mid" : "bad";
  const colors: Record<string, string> = {
    good: "bg-gradient-to-r from-emerald-500 to-emerald-400",
    mid: "bg-gradient-to-r from-amber-500 to-amber-400",
    bad: "bg-gradient-to-r from-rose-500 to-rose-400",
  };
  return (
    <span
      className={cn("inline-block bg-muted rounded-full overflow-hidden relative", className)}
      style={{ width, height }}
      title={`${value} Punkte (${(pct * 100).toFixed(0)}%)`}
    >
      <span
        className={cn("absolute inset-y-0 left-0 rounded-full", colors[tier])}
        style={{ width: `${pct * 100}%` }}
      />
    </span>
  );
}

export function HotBadge({ pct }: { pct: number }) {
  if (pct < 0.85) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30"
      title="Top-Performer auf seiner Position"
    >
      🔥 Hot
    </span>
  );
}
