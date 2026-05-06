"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";

export interface PointsBarChartPoint {
  day: number;
  points: number;
  ligaAvg?: number;
}

/**
 * Punkte-pro-Spieltag-Balken-Chart für eigenen User.
 * Färbt Balken nach Performance: rot < 50, gelb 50-90, grün > 90.
 * Optional: Liga-Schnitt als horizontale Referenzlinie.
 */
export function PointsBarChart({
  data,
  ligaAvg,
}: {
  data: PointsBarChartPoint[];
  /** Schnitt aller Manager über alle Spieltage als Referenzlinie */
  ligaAvg?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        Nicht genug Spieltag-Daten.
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.points), 1);
  // Skala für Team-Spieltagspunkte (mdp = Punkte aller 11 aufgestellten Spieler):
  // < 500    → tiefrot (hue 0)
  // 500-1000 → rot → gelb (hue 0 → 60)
  // 1000-1300→ gelb → grün (hue 60 → 120)
  // > 1300   → komplett grün, hohe Sättigung
  const colorFor = (pts: number): string => {
    if (pts <= 0) return "#cbd5e1";
    if (pts < 500) return "hsl(0, 75%, 45%)"; // tiefrot
    if (pts >= 1300) return "hsl(120, 80%, 38%)"; // sattes grün
    let hue: number;
    if (pts < 1000) hue = ((pts - 500) / 500) * 60; // 0..60
    else hue = 60 + ((pts - 1000) / 300) * 60; // 60..120
    return `hsl(${hue}, 72%, 46%)`;
  };

  return (
    <div className="h-56 sm:h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(v) => `${v}`}
            stroke="#cbd5e1"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            stroke="#cbd5e1"
            domain={[0, Math.ceil(max / 100) * 100]}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "0 4px 16px -4px rgba(15,23,42,0.08)",
            }}
            labelStyle={{ color: "#64748b", fontWeight: 600 }}
            labelFormatter={(v) => `Spieltag ${v}`}
            formatter={(value) => [`${Number(value)} Pkt`, "Deine Punkte"]}
          />
          {ligaAvg !== undefined && ligaAvg > 0 && (
            <ReferenceLine
              y={ligaAvg}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{
                value: `Liga-Ø ${Math.round(ligaAvg)}`,
                position: "right",
                fill: "#64748b",
                fontSize: 10,
              }}
            />
          )}
          <Bar dataKey="points" radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.day} fill={colorFor(d.points)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
