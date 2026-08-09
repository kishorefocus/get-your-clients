"use client";

import { Topbar } from "@/components/features/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Send, MessageSquare, DollarSign, ArrowUpRight, Zap } from "lucide-react";
import { mockLeads } from "@/lib/mock/leads";
import { formatCoords } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerChild, fadeUp, cardHoverProps, EASE_OUT } from "@/lib/motion";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { useEffect, useRef, useState } from "react";

/* ─── KPI data ───────────────────────────────────────────────────────────── */

const kpis = [
  { label: "Leads found", rawValue: 2481, display: "2,481", delta: "+12.4%", icon: Users, spark: [30, 42, 38, 55, 47, 63, 72] },
  { label: "Outreach sent", rawValue: 914, display: "914", delta: "+6.1%", icon: Send, spark: [20, 28, 22, 35, 30, 42, 48] },
  { label: "Response rate", rawValue: 238, display: "23.8%", delta: "+2.3pt", icon: MessageSquare, spark: [18, 21, 20, 22, 23, 22, 24] },
  { label: "Deals in pipeline", rawValue: 186, display: "$186K", delta: "+18.9%", icon: DollarSign, spark: [80, 95, 88, 110, 105, 130, 145] },
];

/* ─── Sparkline component ────────────────────────────────────────────────── */

function Sparkline({ data, color = "hsl(228 100% 57%)" }: { data: number[]; color?: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 56;
  const h = 24;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * h,
  ]);
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");

  return (
    <svg width={w} height={h} className="opacity-60">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── KPI Card with count-up ─────────────────────────────────────────────── */

function KpiCard({ kpi }: { kpi: typeof kpis[0] }) {
  const { value, ref } = useCountUp<HTMLParagraphElement>(kpi.rawValue, 900);
  const Icon = kpi.icon;

  // Format the counted value to match display style
  const formatted =
    kpi.display.startsWith("$")
      ? `$${value}K`
      : kpi.display.endsWith("%")
      ? `${(value / 10).toFixed(1)}%`
      : value.toLocaleString();

  return (
    <motion.div variants={staggerChild} {...cardHoverProps}>
      <Card className="overflow-hidden transition-shadow hover:shadow-card">
        <CardContent className="flex items-start justify-between p-5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
            <p
              ref={ref}
              className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums"
            >
              {formatted}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
              <ArrowUpRight className="h-3 w-3" /> {kpi.delta} this month
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <Sparkline data={kpi.spark} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Activity feed ──────────────────────────────────────────────────────── */

const initialActivity = mockLeads.slice(0, 5);

const mockNewEvents = [
  { id: "live-1", name: "Tanaka Electronics", city: "Osaka", country: "Japan", category: "Electronics", lat: 34.69, lng: 135.50, countryCode: "JP", stage: "new" as const },
  { id: "live-2", name: "Bergen Maritime Co.", city: "Bergen", country: "Norway", category: "Shipping", lat: 60.39, lng: 5.32, countryCode: "NO", stage: "contacted" as const },
];

export default function DashboardOverviewPage() {
  const [activity, setActivity] = useState(initialActivity);
  const [newId, setNewId] = useState<string | null>(null);
  const eventIndex = useRef(0);

  // Simulate a new activity item arriving every 12 seconds
  useEffect(() => {
    const id = setInterval(() => {
      const next = mockNewEvents[eventIndex.current % mockNewEvents.length];
      eventIndex.current++;
      setActivity((prev) => [next as typeof prev[0], ...prev.slice(0, 6)]);
      setNewId(next.id);
      setTimeout(() => setNewId(null), 800);
    }, 12_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Overview" />
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">

        {/* KPI grid */}
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {kpis.map((k) => (
            <KpiCard key={k.label} kpi={k} />
          ))}
        </motion.div>

        {/* Activity + Top Countries */}
        <motion.div
          className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 0.2 }}
        >
          {/* Recent activity */}
          <motion.div variants={staggerChild} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent activity</CardTitle>
                  <span className="manifest-chip">
                    <Zap className="h-2.5 w-2.5 text-accent" />
                    LIVE
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-5">
                <AnimatePresence initial={false}>
                  {activity.map((lead) => (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0 }}
                      transition={{ duration: 0.2, ease: EASE_OUT }}
                      className={`flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/40 cursor-default ${
                        newId === lead.id ? "border-primary/40 bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{lead.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {lead.city}, {lead.country} · {lead.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="manifest-chip hidden sm:flex">
                          {formatCoords(lead.lat, lead.lng)} · {lead.countryCode}
                        </span>
                        <Badge
                          variant={
                            lead.stage === "won"
                              ? "success"
                              : lead.stage === "lost"
                              ? "danger"
                              : "default"
                          }
                        >
                          {lead.stage}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top countries */}
          <motion.div variants={staggerChild}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Top countries this week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-5">
                {[
                  { country: "Turkey", pct: 38 },
                  { country: "Sweden", pct: 31 },
                  { country: "Japan", pct: 24 },
                  { country: "Netherlands", pct: 17 },
                ].map(({ country, pct }, i) => (
                  <motion.div
                    key={country}
                    className="space-y-1"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.2, ease: EASE_OUT }}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{country}</span>
                      <span className="font-mono text-xs text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-primary/60"
                        initial={{ width: "0%" }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4 + i * 0.06, duration: 0.6, ease: EASE_OUT }}
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
