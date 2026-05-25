"use client";

import { useState } from "react";
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
import { formatEUR, cn } from "@/lib/utils";

export interface TVChartPoint {
  /** Datums-Label, z.B. "01.08." */
  label: string;
  /** Absoluter Zeitstempel (ms) — für Zeitraum-Filter */
  ms: number;
  /** Manager-Name → Netto-Teamwert an diesem Stichtag */
  [manager: string]: number | string;
}

type RangeKey = "all" | "ytd" | "6m" | "3m" | "1m";
const DAY = 86_400_000;

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "all", label: "Liga-Start" },
  { key: "ytd", label: "Jahresanfang" },
  { key: "6m", label: "6 Monate" },
  { key: "3m", label: "3 Monate" },
  { key: "1m", label: "1 Monat" },
];

function windowStartMs(key: RangeKey, firstMs: number, lastMs: number): number {
  switch (key) {
    case "ytd":
      return Math.max(new Date(new Date(lastMs).getFullYear(), 0, 1).getTime(), firstMs);
    case "6m":
      return Math.max(lastMs - 182 * DAY, firstMs);
    case "3m":
      return Math.max(lastMs - 91 * DAY, firstMs);
    case "1m":
      return Math.max(lastMs - 30 * DAY, firstMs);
    default:
      return firstMs;
  }
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
  const [range, setRange] = useState<RangeKey>("all");

  if (data.length < 2) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Nicht genug Daten — kommt im Lauf der Saison automatisch.
      </div>
    );
  }

  const firstMs = data[0].ms;
  const lastMs = data[data.length - 1].ms;
  const ws = windowStartMs(range, firstMs, lastMs);
  let view = data.filter((p) => p.ms >= ws);
  if (view.length < 2) view = data; // Fallback: Zeitraum zu kurz für Daten

  return (
    <div>
      {/* Zeitraum-Umschalter */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {RANGES.map((r) => {
          const active = range === r.key;
          // Range ausblenden, wenn er identisch zum vollen Zeitraum wäre
          if (r.key !== "all" && windowStartMs(r.key, firstMs, lastMs) <= firstMs)
            return null;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={view} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs />
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#64748b", fontSize: 11 }}
            minTickGap={24}
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
    </div>
  );
}
