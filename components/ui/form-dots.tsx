import { cn } from "@/lib/utils";

export function FormDots({
  points,
  max = 5,
  className,
}: {
  /** Last N matchday points (oldest → newest). null = didn't play */
  points: (number | null | undefined)[];
  max?: number;
  className?: string;
}) {
  const list = points.slice(-max);
  while (list.length < max) list.unshift(undefined);

  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-label="Form letzte Spieltage">
      {list.map((p, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center justify-center size-5 rounded-md text-[9px] font-bold tabular",
            scoreClass(p)
          )}
          title={p === null || p === undefined ? "Nicht gespielt" : `${p} Punkte`}
        >
          {p === null || p === undefined ? "·" : p > 99 ? "★" : p}
        </span>
      ))}
    </span>
  );
}

function scoreClass(p: number | null | undefined): string {
  if (p === null || p === undefined) return "score-zero";
  if (p >= 100) return "score-good";
  if (p >= 70) return "score-good";
  if (p >= 40) return "score-mid";
  return "score-bad";
}
