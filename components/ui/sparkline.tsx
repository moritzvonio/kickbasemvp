import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  width = 80,
  height = 24,
  color = "currentColor",
  className,
  fillOpacity = 0.15,
}: {
  values: (number | null | undefined)[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  fillOpacity?: number;
}) {
  const data = values.filter((v): v is number => typeof v === "number");
  if (data.length < 2) {
    return (
      <span
        className={cn("inline-block bg-muted rounded", className)}
        style={{ width, height }}
        aria-label="Nicht genug Daten"
      />
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = "M" + points.join(" L");
  const fillPath = `${path} L${(data.length - 1) * stepX},${height} L0,${height} Z`;

  return (
    <svg
      className={cn("inline-block", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      role="img"
      aria-label="Trend"
    >
      <path d={fillPath} fill={color} fillOpacity={fillOpacity} />
      <path d={path} stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) * stepX} cy={height - ((data[data.length - 1]! - min) / range) * height} r="2.25" fill={color} />
    </svg>
  );
}
