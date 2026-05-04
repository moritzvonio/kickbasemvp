import { cn } from "@/lib/utils";

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
        <span className={cn("font-bold tracking-tight text-foreground leading-none", textClassName)}>
          Kickbase<span className="text-primary">MVP</span>
        </span>
      )}
    </span>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-xl text-white font-bold overflow-hidden shadow-[0_4px_14px_-4px_rgba(16,185,129,0.55)] ring-1 ring-emerald-700/20"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)",
        fontSize: size * 0.55,
      }}
      aria-label="KickbaseMVP"
    >
      {/* Subtle football pitch arc background */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full opacity-25"
        aria-hidden
      >
        <circle cx="50" cy="50" r="22" fill="none" stroke="white" strokeWidth="2.5" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="2" />
      </svg>
      {/* K letter */}
      <span className="relative leading-none -translate-y-[2%]">K</span>
      {/* MVP star badge in corner */}
      <span
        className="absolute rounded-full bg-amber-400 text-amber-900 font-black flex items-center justify-center ring-2 ring-white shadow-sm"
        style={{
          width: size * 0.42,
          height: size * 0.42,
          top: -size * 0.08,
          right: -size * 0.08,
          fontSize: size * 0.26,
          lineHeight: 1,
        }}
      >
        ★
      </span>
    </span>
  );
}
