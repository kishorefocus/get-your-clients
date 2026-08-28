"use client";

import { funnelData, conversionRate } from "@/lib/mock/analytics";
import { FunnelStage } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function FunnelChart({ data }: { data?: FunnelStage[] }) {
  const chartData = data || funnelData;

  const newStage = chartData.find((f) => f.stage === "new");
  const wonStage = chartData.find((f) => f.stage === "won");
  const computedConversionRate =
    newStage && wonStage && newStage.count > 0
      ? Math.round((wonStage.count / newStage.count) * 100 * 10) / 10
      : conversionRate;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold">Pipeline Funnel</h3>
          <p className="text-[11px] text-muted-foreground">New → Won conversion</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-success">{computedConversionRate}%</p>
          <p className="text-[10px] text-muted-foreground">Overall conversion</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220 16% 89%)" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(220 16% 89%)",
              fontSize: 12,
            }}
            formatter={(v: number, name: string) => [v, "Leads"]}
          />
          <Bar 
            dataKey="count" 
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Mini legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {chartData.map((f) => (
          <div key={f.stage} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: f.color }} />
            {f.label}: <span className="font-semibold text-foreground">{f.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
