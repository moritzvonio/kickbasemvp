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

export function MarketValueChart({ data, color = "#d20515" }: { data: Point[]; color?: string }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="mvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#71717a", fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={28}
            stroke="#3f3f46"
          />
          <YAxis
            domain={["dataMin - 100000", "dataMax + 100000"]}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickFormatter={(v) => formatEUR(v, { compact: true })}
            width={70}
            stroke="#3f3f46"
          />
          <Tooltip
            contentStyle={{
              background: "#141414",
              border: "1px solid #262626",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value) => [formatEUR(Number(value)), "Marktwert"]}
          />
          <Area
            type="monotone"
            dataKey="mv"
            stroke={color}
            strokeWidth={2}
            fill="url(#mvGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
