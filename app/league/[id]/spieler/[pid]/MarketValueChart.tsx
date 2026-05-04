"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatEUR } from "@/lib/utils";

interface Point {
  ts: number;
  date: string;
  mv: number;
}

export function MarketValueChart({ data, color = "#10b981" }: { data: Point[]; color?: string }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="mvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={28}
            stroke="#cbd5e1"
          />
          <YAxis
            domain={["dataMin - 100000", "dataMax + 100000"]}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(v) => formatEUR(v, { compact: true })}
            width={70}
            stroke="#cbd5e1"
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "0 4px 16px -4px rgba(15, 23, 42, 0.08)",
            }}
            labelStyle={{ color: "#64748b", fontWeight: 500 }}
            formatter={(value) => [formatEUR(Number(value)), "Marktwert"]}
          />
          <Area
            type="monotone"
            dataKey="mv"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#mvGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
