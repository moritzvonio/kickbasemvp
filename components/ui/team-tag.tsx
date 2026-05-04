import { teamMeta } from "@/lib/kickbase/types";
import { cn } from "@/lib/utils";

export function TeamTag({
  tid,
  className,
  size = "sm",
}: {
  tid: string | undefined;
  className?: string;
  size?: "xs" | "sm" | "md";
}) {
  const t = teamMeta(tid);
  const sizing =
    size === "xs"
      ? "text-[9px] px-1 py-px"
      : size === "md"
      ? "text-xs px-2 py-0.5"
      : "text-[10px] px-1.5 py-0.5";
  return (
    <span
      className={cn(
        "inline-flex items-center font-bold tracking-wider rounded uppercase",
        sizing,
        className
      )}
      style={{ background: `${t.color}1a`, color: t.color }}
    >
      {t.short}
    </span>
  );
}

export function TeamCrest({
  tid,
  size = 32,
  className,
}: {
  tid: string | undefined;
  size?: number;
  className?: string;
}) {
  const t = teamMeta(tid);
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-lg font-bold ring-1 ring-border shrink-0", className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${t.color}26, ${t.color}0a)`,
        color: t.color,
        fontSize: size * 0.32,
      }}
      aria-label={t.name}
    >
      {t.short}
    </span>
  );
}
