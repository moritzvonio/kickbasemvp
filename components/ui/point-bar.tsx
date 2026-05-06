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
 *
 * Skala: linear interpolierte HSL-Hue von rot (0°) → gelb (60°) → grün (120°)
 * proportional zu (value − min) / (max − min). `min` (default 0) bestimmt
 * den "voll rot"-Punkt, `max` den "voll grün"-Punkt.
 *
 * - value <= min     → komplett rot (kleine sichtbare Füllung)
 * - value zwischen   → linear interpoliert
 * - value >= max     → komplett grün (volle Füllung)
 * - value 0/fehlend  → grau ("nicht gespielt")
 *
 * Beispiel Markt: `min=50, max=130` → < 50 = rot, > 130 = grün.
 */
export function BatteryBar({
  value,
  min = 0,
  max,
  className,
  width = 140,
  height = 18,
  segments = 5,
}: {
  value: number | undefined;
  min?: number;
  max: number;
  className?: string;
  width?: number;
  height?: number;
  segments?: number;
}) {
  const safeValue = typeof value === "number" ? value : 0;
  const hasData = safeValue > 0 && max > min;
  const range = max - min;
  // rawPct kann negativ sein (value < min); clampen für Farbe und Füllung
  const rawPct = hasData && range > 0 ? (safeValue - min) / range : 0;
  const colorPct = Math.max(0, Math.min(1, rawPct));
  // Mindestens 6 % Füllung wenn gespielt, damit "schlecht aber gespielt"
  // sichtbar bleibt und nicht mit "nicht gespielt" (grau) verwechselt wird.
  const fillPct = hasData ? Math.max(0.06, Math.min(1, rawPct)) : 0;
  const hue = colorPct * 120;
  const fillBg = hasData
    ? `linear-gradient(90deg, hsl(${hue}, 70%, 48%), hsl(${hue}, 78%, 56%))`
    : "transparent";

  const capW = Math.max(3, Math.round(height * 0.22));
  const capH = Math.round(height * 0.55);
  const bodyW = width - capW - 1;

  return (
    <span
      className={cn("inline-flex items-center align-middle", className)}
      style={{ width, height }}
      title={
        hasData
          ? `${safeValue} Pkt Ø — Skala ${min}-${max} (${Math.round(colorPct * 100)} %)`
          : "Nicht gespielt"
      }
    >
      <span
        className="relative inline-block rounded-md bg-muted ring-1 ring-border overflow-hidden"
        style={{ width: bodyW, height }}
      >
        {hasData && (
          <span
            className="absolute inset-y-0 left-0 rounded-l-md transition-[width,background] duration-500"
            style={{
              width: `${fillPct * 100}%`,
              background: fillBg,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.08)",
            }}
          />
        )}
        {Array.from({ length: segments - 1 }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute inset-y-1 w-px bg-white/35 mix-blend-overlay"
            style={{ left: `${((i + 1) / segments) * 100}%` }}
          />
        ))}
      </span>
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
