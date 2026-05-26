import { cn } from "@/lib/utils";

/**
 * LigaBase-Logo.
 * Mark = aufsteigende Balken auf einer Grundlinie:
 *   - Balken = Liga-Tabelle / Marktwert-Wachstum (Klettern in der Tabelle)
 *   - Grundlinie = „Base" (das Fundament, auf dem alles steht)
 * Wortmarke = Liga (Vordergrund) + Base (Primärfarbe).
 */
export function Logo({
  size = 28,
  className,
  withText = true,
  textClassName,
}: {
  size?: number;
  className?: string;
  withText?: boolean;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      {withText && (
        <span
          className={cn(
            "font-bold tracking-tight text-foreground leading-none",
            textClassName
          )}
        >
          Liga<span className="text-primary">Base</span>
        </span>
      )}
    </span>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-xl overflow-hidden shadow-[0_4px_14px_-4px_rgba(16,185,129,0.55)] ring-1 ring-emerald-700/20"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(135deg, #10b981 0%, #059669 55%, #047857 100%)",
      }}
      aria-label="LigaBase"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden>
        {/* Aufsteigende Tabellen-/Wert-Balken */}
        <rect x="24" y="50" width="14" height="22" rx="5" fill="#ffffff" fillOpacity="0.72" />
        <rect x="43" y="38" width="14" height="34" rx="5" fill="#ffffff" fillOpacity="0.88" />
        <rect x="62" y="24" width="14" height="48" rx="5" fill="#ffffff" />
        {/* Grundlinie = „Base" */}
        <rect x="18" y="72" width="64" height="9" rx="4.5" fill="#ffffff" />
      </svg>
    </span>
  );
}
