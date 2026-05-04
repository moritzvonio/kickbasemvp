import { cn } from "@/lib/utils";

/**
 * Horizontal performance bar (slim).
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

/**
 * Battery-style performance indicator — chunky, prominent display
 * for primary stats. Has a battery cap on the right.
 */
export function BatteryBar({
  value,
  max,
  className,
  width = 140,
  height = 18,
  segments = 5,
}: {
  value: number | undefined;
  max: number;
  className?: string;
  width?: number;
  height?: number;
  segments?: number;
}) {
  const safeValue = value && max > 0 ? value : 0;
  const pct = max > 0 ? Math.min(1, safeValue / max) : 0;
  const tier = pct >= 0.75 ? "good" : pct >= 0.4 ? "mid" : pct > 0 ? "bad" : "empty";
  const fillColor: Record<string, string> = {
    good: "linear-gradient(90deg, #10b981, #34d399)",
    mid: "linear-gradient(90deg, #f59e0b, #fbbf24)",
    bad: "linear-gradient(90deg, #ef4444, #f87171)",
    empty: "transparent",
  };
  const capW = Math.max(3, Math.round(height * 0.22));
  const capH = Math.round(height * 0.55);
  const bodyW = width - capW - 1;

  return (
    <span
      className={cn("inline-flex items-center align-middle", className)}
      style={{ width, height }}
      title={`${safeValue} (${(pct * 100).toFixed(0)}%)`}
    >
      {/* Battery body */}
      <span
        className="relative inline-block rounded-md bg-muted ring-1 ring-border overflow-hidden"
        style={{ width: bodyW, height }}
      >
        {/* Fill */}
        <span
          className="absolute inset-y-0 left-0 rounded-l-md transition-[width] duration-500"
          style={{
            width: `${pct * 100}%`,
            background: fillColor[tier],
            boxShadow:
              tier !== "empty"
                ? "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.08)"
                : undefined,
          }}
        />
        {/* Segment dividers (battery cells) */}
        {Array.from({ length: segments - 1 }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute inset-y-1 w-px bg-white/35 mix-blend-overlay"
            style={{ left: `${((i + 1) / segments) * 100}%` }}
          />
        ))}
      </span>
      {/* Battery cap */}
      <span
        className="inline-block bg-border rounded-r-sm"
        style={{ width: capW, height: capH, marginLeft: 1 }}
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
