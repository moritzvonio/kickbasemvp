"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatEUR } from "@/lib/utils";

export interface TVChartPoint {
  /** Matchday number */
  day: number;
  /** Manager-Name → Netto-Teamwert für diesen Spieltag */
  [manager: string]: number | string;
}

const MANAGER_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // rose
  "#a855f7", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#eab308", // yellow
];

export function TeamValueChart({
  data,
  managers,
  highlightUserId,
}: {
  data: TVChartPoint[];
  /** Ordered list of manager keys (= names used as data keys in `data`) */
  managers: { id: string; name: string }[];
  /** User id to render with thicker stroke */
  highlightUserId?: string;
}) {
  if (data.length < 2) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Nicht genug Spieltag-Daten — kommt im Lauf der Saison automatisch.
      </div>
    );
  }

  return (
    <div className="h-72 sm:h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs />
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(v) => `MD ${v}`}
            stroke="#cbd5e1"
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(v) => formatEUR(v, { compact: true })}
            width={70}
            stroke="#cbd5e1"
            domain={["auto", "auto"]}
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
            formatter={(value, name) => [formatEUR(Number(value), { compact: true }), name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            iconType="circle"
            iconSize={8}
          />
          {managers.map((m, i) => {
            const isMe = m.id === highlightUserId;
            return (
              <Line
                key={m.id}
                type="monotone"
                dataKey={m.name}
                stroke={MANAGER_COLORS[i % MANAGER_COLORS.length]}
                strokeWidth={isMe ? 3 : 1.75}
                dot={false}
                activeDot={{ r: isMe ? 5 : 3.5 }}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
