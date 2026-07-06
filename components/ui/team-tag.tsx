import { teamMeta, teamLogoUrl } from "@/lib/kickbase/types";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: { logo: 22, text: "text-[10px]", pad: "px-1 py-px gap-1" },
  sm: { logo: 28, text: "text-[11px]", pad: "px-1.5 py-0.5 gap-1.5" },
  md: { logo: 36, text: "text-xs", pad: "px-2 py-0.5 gap-1.5" },
} as const;

/**
 * Inline team tag – renders the actual club logo when known,
 * falls back to the colored abbreviation pill otherwise.
 */
export function TeamTag({
  tid,
  className,
  size = "sm",
  withText = false,
}: {
  tid: string | undefined;
  className?: string;
  size?: keyof typeof SIZES;
  /** Force showing the abbreviation alongside the logo */
  withText?: boolean;
}) {
  const t = teamMeta(tid);
  const logo = teamLogoUrl(tid);
  const s = SIZES[size];

  // Logo-only display (default when logo available + no text requested)
  if (logo && !withText) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={t.name}
        title={t.name}
        width={s.logo}
        height={s.logo}
        className={cn("inline-block object-contain shrink-0", className)}
        loading="lazy"
      />
    );
  }

  // Logo + text combined
  if (logo && withText) {
    return (
      <span
        className={cn(
          "inline-flex items-center font-bold tracking-wider rounded uppercase",
          s.text,
          s.pad,
          className
        )}
        style={{ background: `${t.color}1a`, color: t.color }}
        title={t.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          width={s.logo}
          height={s.logo}
          className="inline-block object-contain"
          loading="lazy"
        />
        {t.short}
      </span>
    );
  }

  // Text-only fallback (no logo known)
  return (
    <span
      className={cn(
        "inline-flex items-center font-bold tracking-wider rounded uppercase",
        s.text,
        s.pad,
        className
      )}
      style={{ background: `${t.color}1a`, color: t.color }}
      title={t.name}
    >
      {t.short}
    </span>
  );
}

/**
 * Full crest – actual SVG logo when known, else fallback color tile with letters.
 */
export function TeamCrest({
  tid,
  size = 32,
  className,
  showFallbackText = true,
}: {
  tid: string | undefined;
  size?: number;
  className?: string;
  showFallbackText?: boolean;
}) {
  const t = teamMeta(tid);
  const logo = teamLogoUrl(tid);

  if (logo) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg shrink-0 overflow-hidden bg-white ring-1 ring-border",
          className
        )}
        style={{ width: size, height: size }}
        title={t.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={t.name}
          width={size}
          height={size}
          className="object-contain"
          style={{ width: size * 0.92, height: size * 0.92 }}
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-bold ring-1 ring-border shrink-0",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${t.color}26, ${t.color}0a)`,
        color: t.color,
        fontSize: size * 0.32,
      }}
      title={t.name}
      aria-label={t.name}
    >
      {showFallbackText ? t.short : null}
    </span>
  );
}
