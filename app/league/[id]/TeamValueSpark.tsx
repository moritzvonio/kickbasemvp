"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  Legend,
} from "recharts";
import { formatEUR, cn } from "@/lib/utils";

export interface TVSparkPoint {
  day: number;
  tv: number;
}

export interface TVSparkManager {
  id: string;
  name: string;
  data: TVSparkPoint[];
}

const COMPARE_COLOR = "#3b82f6"; // blue

/**
 * Responsive Linien-Chart für die Teamwert-Entwicklung des eigenen Users
 * über die Saison. Mit Tooltip beim Hover und optionalem Vergleich gegen
 * einen anderen Manager (Dropdown).
 */
export function TeamValueSpark({
  data,
  selfName = "Du",
  managers = [],
}: {
  data: TVSparkPoint[];
  selfName?: string;
  managers?: TVSparkManager[];
}) {
  const [compareId, setCompareId] = useState<string>("");

  const compareManager = managers.find((m) => m.id === compareId);

  // Merge eigene + compare-Daten zu einer Zeile pro Spieltag
  const mergedData = useMemo(() => {
    const compareByDay = new Map<number, number>();
    if (compareManager) {
      for (const p of compareManager.data) compareByDay.set(p.day, p.tv);
    }
    return data.map((d) => ({
      day: d.day,
      self: d.tv,
      compare: compareByDay.get(d.day) ?? null,
    }));
  }, [data, compareManager]);

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground">
        Nicht genug Daten — kommt mit den Spieltagen.
      </div>
    );
  }

  // Y-Range basiert auf eigenen + compare-Daten
  const allTvs = [
    ...data.map((d) => d.tv),
    ...(compareManager?.data.map((d) => d.tv) ?? []),
  ];
  const max = Math.max(...allTvs);
  const maxDay = Math.max(...data.map((d) => d.day));

  // X-Ticks: nur gerade Zahlen in 4er-Schritten
  const xTicks: number[] = [];
  for (let i = 4; i <= maxDay; i += 4) xTicks.push(i);

  // Y-Achse startet bei 0, Top auf nächste 50-Mio-Grenze gerundet
  const yMax = Math.ceil(max / 50_000_000) * 50_000_000 || 50_000_000;

  return (
    <div className="flex flex-col h-full min-h-[260px] w-full">
      {managers.length > 0 && (
        <div className="px-2 pb-1 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Vergleich:
          </span>
          <select
            value={compareId}
            onChange={(e) => setCompareId(e.target.value)}
            className={cn(
              "text-[11px] px-2 py-1 rounded-md border bg-card font-medium",
              "border-border text-foreground hover:border-primary/40",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              compareId && "border-blue-300 bg-blue-50/40"
            )}
          >
            <option value="">— kein Vergleich —</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {compareManager && (
            <button
              onClick={() => setCompareId("")}
              className="text-[10px] text-muted-foreground hover:text-foreground"
              aria-label="Vergleich entfernen"
            >
              ✕
            </button>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={mergedData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="tv-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "#64748b", fontSize: 10 }}
              stroke="#cbd5e1"
              ticks={xTicks}
              type="number"
              domain={[1, maxDay]}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)} Mio €`}
              stroke="#cbd5e1"
              width={64}
              domain={[0, yMax]}
              allowDataOverflow={false}
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
              formatter={(value, name) => [
                value === null || value === undefined
                  ? "—"
                  : formatEUR(Number(value), { compact: true }),
                name,
              ]}
            />
            {compareManager && (
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                iconType="circle"
                iconSize={8}
              />
            )}
            <Area
              type="monotone"
              dataKey="self"
              stroke="none"
              fill="url(#tv-fill)"
              name={selfName}
            />
            <Line
              type="monotone"
              dataKey="self"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981" }}
              name={selfName}
            />
            {compareManager && (
              <Line
                type="monotone"
                dataKey="compare"
                stroke={COMPARE_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: COMPARE_COLOR }}
                name={compareManager.name}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
