"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type LeadVolumePoint = {
  week: string;
  leads: number;
};

type LeadVolumeChartProps = {
  data: LeadVolumePoint[];
};

export function LeadVolumeChart({ data }: LeadVolumeChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="rgba(244,241,234,0.08)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: "rgba(244,241,234,0.55)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "rgba(244,241,234,0.55)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: "#0a0a0a",
              border: "1px solid rgba(244,241,234,0.15)",
              borderRadius: 8,
              color: "#f4f1ea",
              fontSize: 12,
            }}
            labelStyle={{ color: "#89cff0" }}
          />
          <Line
            type="monotone"
            dataKey="leads"
            stroke="#89cff0"
            strokeWidth={2}
            dot={{ r: 3, fill: "#89cff0", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
