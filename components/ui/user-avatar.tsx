import { KICKBASE_CDN } from "@/lib/kickbase/types";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
} as const;

export function UserAvatar({
  name,
  image,
  size = "sm",
  className,
}: {
  name?: string;
  image?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const dim = SIZES[size];
  if (image) {
    const url = image.startsWith("http")
      ? image
      : `${KICKBASE_CDN}/${image.replace(/^\//, "")}`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? "User"}
        className={cn(
          dim,
          "rounded-full shrink-0 object-cover bg-muted ring-1 ring-border",
          className
        )}
        loading="lazy"
      />
    );
  }
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <span
      className={cn(
        dim,
        "rounded-full shrink-0 bg-primary/15 text-primary inline-flex items-center justify-center font-semibold ring-1 ring-primary/20",
        className
      )}
      aria-label={name}
    >
      {initial}
    </span>
  );
}
