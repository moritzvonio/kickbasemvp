import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
  accent,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  accent?: "primary" | "warning" | "success" | "danger" | "info";
  className?: string;
}) {
  const accentBar: Record<string, string> = {
    primary: "from-primary to-emerald-300",
    success: "from-emerald-500 to-emerald-300",
    warning: "from-amber-500 to-amber-300",
    danger: "from-rose-500 to-rose-300",
    info: "from-sky-500 to-sky-300",
  };
  const iconBg: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    danger: "bg-rose-500/10 text-rose-600",
    info: "bg-sky-500/10 text-sky-600",
  };

  const a = accent ?? "primary";

  return (
    <Card className={cn("card-hover relative overflow-hidden", className)}>
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r", accentBar[a])} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={cn("inline-flex size-8 items-center justify-center rounded-lg", iconBg[a])}>
            {icon}
          </span>
          {trend && (
            <TrendArrow direction={trend} />
          )}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
          {label}
        </div>
        <div className="text-2xl font-bold tracking-tight tabular">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function TrendArrow({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "up")
    return <span className="text-emerald-600 text-xs font-bold">↑</span>;
  if (direction === "down")
    return <span className="text-rose-600 text-xs font-bold">↓</span>;
  return <span className="text-muted-foreground text-xs">·</span>;
}
