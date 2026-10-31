"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeeklyCount } from "@/lib/admin-leads";

const PLASTER = "#eef1f4";
const tick = { fill: "rgba(238,241,244,0.8)", fontSize: 12 };

/** Weekly lead counts as bars, with the same figures in a table for screen readers. */
export function LeadVolumeChart({ data }: { data: WeeklyCount[] }) {
  return (
    <>
      <div className="mt-4 h-60 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(238,241,244,0.1)" vertical={false} />
            <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} minTickGap={12} />
            <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              cursor={{ fill: "rgba(238,241,244,0.06)" }}
              contentStyle={{
                background: "#0e1a30",
                border: "1px solid #737b88",
                borderRadius: 8,
                color: PLASTER,
                fontSize: 13,
              }}
              labelStyle={{ color: "#b9d3ff" }}
              itemStyle={{ color: PLASTER }}
              formatter={(value) => [value, "Leads"]}
              labelFormatter={(label) => `Week of ${label}`}
            />
            <Bar dataKey="leads" fill="#8db6ff" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Leads per week</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">Leads</th>
          </tr>
        </thead>
        <tbody>
          {data.map((week) => (
            <tr key={week.week}>
              <td>{week.label}</td>
              <td>{week.leads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
