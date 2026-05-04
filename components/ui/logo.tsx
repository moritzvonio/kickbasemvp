import { cn } from "@/lib/utils";

export function Logo({
  size = 28,
  className,
  withText = true,
}: {
  size?: number;
  className?: string;
  withText?: boolean;
}) {
  const text = (
    <span className="font-bold tracking-tight text-foreground">
      Better<span className="text-primary">Base</span>
    </span>
  );

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="inline-flex items-center justify-center rounded-xl text-white font-bold relative overflow-hidden shadow-[0_4px_12px_-2px_rgba(16,185,129,0.45)]"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
          fontSize: size * 0.5,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full opacity-25"
          aria-hidden
        >
          <circle cx="50" cy="50" r="22" fill="none" stroke="white" strokeWidth="2.5" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="2.5" />
        </svg>
        <span className="relative">B</span>
      </span>
      {withText && text}
    </span>
  );
}
