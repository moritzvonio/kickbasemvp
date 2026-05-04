import { POSITION_LABELS } from "@/lib/kickbase/types";
import { cn } from "@/lib/utils";

const POSITION_BG: Record<number, string> = {
  1: "bg-amber-100 text-amber-700 ring-amber-200",         // GK = goalkeeper
  2: "bg-sky-100 text-sky-700 ring-sky-200",                // DEF
  3: "bg-emerald-100 text-emerald-700 ring-emerald-200",    // MID
  4: "bg-rose-100 text-rose-700 ring-rose-200",             // FWD
};

export function PositionBadge({
  pos,
  className,
}: {
  pos: number;
  className?: string;
}) {
  const label = POSITION_LABELS[pos] ?? "?";
  const cls = POSITION_BG[pos] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[2.25rem] h-5 px-1.5 rounded text-[10px] font-bold uppercase tracking-wider ring-1",
        cls,
        className
      )}
    >
      {label}
    </span>
  );
}
