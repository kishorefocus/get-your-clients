"use client";

import { weeklyPerformance } from "@/lib/mock/analytics";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function PerformanceChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <h3 className="font-display text-sm font-semibold mb-1">Outreach Performance</h3>
      <p className="text-[11px] text-muted-foreground mb-4">Outreach sent vs. responses — last 12 weeks</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={weeklyPerformance} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(228 100% 57%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(228 100% 57%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradResp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160 71% 33%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(160 71% 33%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 89%)" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(220 16% 89%)",
              fontSize: 12,
            }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
          <Area
            type="monotone"
            dataKey="outreach"
            name="Outreach sent"
            stroke="hsl(228 100% 57%)"
            strokeWidth={2}
            fill="url(#gradOut)"
          />
          <Area
            type="monotone"
            dataKey="responses"
            name="Responses"
            stroke="hsl(160 71% 33%)"
            strokeWidth={2}
            fill="url(#gradResp)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
