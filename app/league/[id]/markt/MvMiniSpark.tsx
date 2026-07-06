"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEUR } from "@/lib/utils";

export interface MvSparkPoint {
  dt: number;
  mv: number;
}

/**
 * Mini-Verlaufschart für 14-Tage-MV.
 * Zeigt Tooltip beim Hover (Datum + MV).
 * Linie wechselt Farbe bei Anstieg (grün) / Abstieg (rot) / flat (grau).
 */
export function MvMiniSpark({
  points,
  className,
  height = 60,
}: {
  points: MvSparkPoint[];
  className?: string;
  height?: number;
}) {
  if (points.length < 2) {
    return (
      <div
        className={className}
        style={{ height }}
        aria-label="Nicht genug Daten"
      />
    );
  }

  const sorted = points.slice().sort((a, b) => a.dt - b.dt);
  const first = sorted[0].mv;
  const last = sorted[sorted.length - 1].mv;
  const isUp = last > first;
  const isDown = last < first;
  const color = isUp ? "#10b981" : isDown ? "#ef4444" : "#94a3b8";

  // Daten für Recharts: Datum als JS-Date für Label-Format
  const data = sorted.map((p) => ({
    dt: p.dt,
    label: dtToLabel(p.dt),
    mv: p.mv,
  }));

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={`mv-fill-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Hidden axes – wir wollen nur die Datenführung, kein Achsen-Drawing */}
          <XAxis dataKey="dt" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 11,
              padding: "4px 8px",
              boxShadow: "0 4px 16px -4px rgba(15,23,42,0.08)",
            }}
            labelStyle={{ color: "#64748b", fontWeight: 600, fontSize: 10 }}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload;
              return p ? p.label : "";
            }}
            formatter={(value) => [formatEUR(Number(value), { compact: true }), "MV"]}
          />
          <Area
            type="monotone"
            dataKey="mv"
            stroke="none"
            fill={`url(#mv-fill-${color.slice(1)})`}
          />
          <Line
            type="monotone"
            dataKey="mv"
            stroke={color}
            strokeWidth={1.75}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function dtToLabel(dt: number): string {
  // dt = Tage seit Unix epoch
  const d = new Date(dt * 86_400_000);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}
