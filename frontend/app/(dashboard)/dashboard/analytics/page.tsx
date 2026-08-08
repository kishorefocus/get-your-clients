"use client";

import { Topbar } from "@/components/features/layout/topbar";
import { PerformanceChart } from "@/components/features/analytics/performance-chart";
import { FunnelChart } from "@/components/features/analytics/funnel-chart";
import { CountryBreakdown } from "@/components/features/analytics/country-breakdown";
import { RepLeaderboard } from "@/components/features/analytics/rep-leaderboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { conversionRate, avgResponseRate } from "@/lib/mock/analytics";
import { Download, TrendingUp, Percent, Globe2, PhoneCall } from "lucide-react";

const kpis = [
  { label: "Total leads discovered", value: "2,481", delta: "+12.4%", icon: Globe2 },
  { label: "Conversion rate", value: `${conversionRate}%`, delta: "+1.4pt", icon: TrendingUp },
  { label: "Avg. response rate", value: `${avgResponseRate}%`, delta: "+3.1pt", icon: Percent },
  { label: "Total calls made", value: "315", delta: "+22%", icon: PhoneCall },
];

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar
        title="Analytics"
        actions={
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="animate-fade-up">
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <p className="text-[11px] text-muted-foreground">{k.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold">{k.value}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-success">{k.delta} this month</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <k.icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PerformanceChart />
          <FunnelChart />
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CountryBreakdown />
          </div>
          <RepLeaderboard />
        </div>
      </div>
    </div>
  );
}
