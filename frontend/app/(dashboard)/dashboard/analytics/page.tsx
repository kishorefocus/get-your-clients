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
import { motion } from "framer-motion";
import { staggerContainer, staggerChild, cardHoverProps } from "@/lib/motion";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { useDashboardAnalytics } from "@/lib/hooks/use-dashboard";

const kpis = [
  { label: "Total leads discovered", rawValue: 2481, display: "2,481", delta: "+12.4%", icon: Globe2 },
  { label: "Conversion rate", rawValue: conversionRate * 10, display: `${conversionRate}%`, delta: "+1.4pt", icon: TrendingUp },
  { label: "Avg. response rate", rawValue: avgResponseRate * 10, display: `${avgResponseRate}%`, delta: "+3.1pt", icon: Percent },
  { label: "Total calls made", rawValue: 315, display: "315", delta: "+22%", icon: PhoneCall },
];

const kpiIcons: Record<string, any> = {
  "Total leads discovered": Globe2,
  "Conversion rate": TrendingUp,
  "Avg. response rate": Percent,
  "Total calls made": PhoneCall,
};

function AnalyticsKpiCard({ kpi }: { kpi: any }) {
  const { value, ref } = useCountUp<HTMLParagraphElement>(kpi.rawValue, 900);
  const Icon = kpi.icon || Globe2;

  const formattedValue = kpi.display.endsWith("%")
    ? `${(value / 10).toFixed(1)}%`
    : value.toLocaleString();

  return (
    <motion.div variants={staggerChild} {...cardHoverProps}>
      <Card className="hover:shadow-card transition-shadow">
        <CardContent className="flex items-start justify-between p-4">
          <div>
            <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
            <p ref={ref} className="mt-1 font-display text-2xl font-bold tracking-tight">
              {formattedValue}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-success">{kpi.delta} this month</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const { data: analyticsData, isLoading } = useDashboardAnalytics();

  const activeKpis = analyticsData?.kpis || kpis;
  const kpisToRender = activeKpis.map((k) => ({
    ...k,
    icon: kpiIcons[k.label] || Globe2,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar
        title="Analytics"
        actions={
          <Button variant="ghost" size="sm" className="gap-2 text-xs hover:bg-muted/80 focus-visible:outline-ring">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-5">
        {/* KPI row */}
        {isLoading ? (
          <div className="flex h-16 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {kpisToRender.map((k) => (
              <AnalyticsKpiCard key={k.label} kpi={k} />
            ))}
          </motion.div>
        )}

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PerformanceChart data={analyticsData?.weeklyPerformance} />
          <FunnelChart data={analyticsData?.funnelData} />
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CountryBreakdown data={analyticsData?.countryMetrics} />
          </div>
          <RepLeaderboard data={analyticsData?.repStats} />
        </div>
      </div>
    </div>
  );
}
