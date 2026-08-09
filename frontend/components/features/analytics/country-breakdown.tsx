"use client";

import { countryMetrics } from "@/lib/mock/analytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function CountryBreakdown() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <h3 className="font-display text-sm font-semibold mb-1">Leads by Country</h3>
      <p className="text-[11px] text-muted-foreground mb-4">Top 8 countries — leads discovered vs. deals won</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={countryMetrics}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          barCategoryGap="25%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(220 16% 89%)" />
          <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="country"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(220 16% 89%)",
              fontSize: 12,
            }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="leads" name="Leads" fill="hsl(228 100% 57%)" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
          <Bar dataKey="won" name="Won" fill="hsl(160 71% 33%)" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
