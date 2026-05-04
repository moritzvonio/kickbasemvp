import { teamMeta, teamLogoUrl, playerImageUrl } from "@/lib/kickbase/types";
import { cn } from "@/lib/utils";

/**
 * Standardized player avatar with smart fallback:
 *   1. Player photo (pim)
 *   2. Team logo on colored gradient
 *   3. Team color + abbreviation text
 */
export function PlayerAvatar({
  pim,
  tid,
  size = 48,
  rounded = "lg",
  className,
}: {
  pim?: string;
  tid: string | undefined;
  size?: number;
  rounded?: "md" | "lg" | "xl" | "full";
  className?: string;
}) {
  const team = teamMeta(tid);
  const playerImg = playerImageUrl(pim);
  const logo = teamLogoUrl(tid);

  const radius =
    rounded === "md"
      ? "rounded-md"
      : rounded === "xl"
      ? "rounded-2xl"
      : rounded === "full"
      ? "rounded-full"
      : "rounded-lg";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-border",
        radius,
        className
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${team.color}26, ${team.color}0a)`,
      }}
      title={team.name}
    >
      {playerImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={playerImg}
          alt={team.name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={team.name}
          width={Math.round(size * 0.92)}
          height={Math.round(size * 0.92)}
          className="object-contain"
          loading="lazy"
          style={{ width: size * 0.92, height: size * 0.92 }}
        />
      ) : (
        <span
          className="font-bold"
          style={{ color: team.color, fontSize: size * 0.32 }}
        >
          {team.short}
        </span>
      )}
    </span>
  );
}
