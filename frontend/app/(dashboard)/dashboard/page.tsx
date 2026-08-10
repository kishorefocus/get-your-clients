"use client";

import { Topbar } from "@/components/features/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Send,
  MessageSquare,
  DollarSign,
  ArrowUpRight,
  Zap,
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  X,
} from "lucide-react";
import { mockLeads } from "@/lib/mock/leads";
import { cn, formatCoords } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerChild, fadeUp, cardHoverProps, EASE_OUT, springUI } from "@/lib/motion";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { useEffect, useRef, useState } from "react";
import {
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
} from "@/lib/hooks/use-reminders";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { toast } from "sonner";

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

  // Store leads to link in reminder modal
  const leads = useLeadsStore((s) => s.leads);

  // Reminders API
  const { data: reminders = [], isLoading: isLoadingReminders } = useReminders(true); // dueSoon = true
  const createReminderMutation = useCreateReminder();
  const updateReminderMutation = useUpdateReminder();
  const deleteReminderMutation = useDeleteReminder();

  // Create reminder state
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    notes: "",
    due_at: "",
    client_id: "",
  });

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

  const handleToggleReminder = async (id: string, isDone: boolean) => {
    try {
      await updateReminderMutation.mutateAsync({
        id,
        payload: { is_done: !isDone },
      });
      toast.success(isDone ? "Reminder marked incomplete" : "Reminder marked completed");
    } catch (err) {}
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteReminderMutation.mutateAsync(id);
    } catch (err) {}
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderForm.title.trim() || !reminderForm.due_at) {
      toast.error("Title and Due Time are required");
      return;
    }
    try {
      await createReminderMutation.mutateAsync({
        title: reminderForm.title.trim(),
        notes: reminderForm.notes.trim() || undefined,
        due_at: new Date(reminderForm.due_at).toISOString(),
        client_id: reminderForm.client_id || undefined,
      });
      setIsReminderModalOpen(false);
      setReminderForm({ title: "", notes: "", due_at: "", client_id: "" });
    } catch (err) {}
  };

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

        {/* Reminders & Follow-up Tasks */}
        <motion.div
          className="mt-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 0.3 }}
        >
          <motion.div variants={staggerChild}>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4.5 w-4.5 text-primary" /> Reminders & Due Follow-ups (Next 48h)
                </CardTitle>
                <Button size="sm" className="h-8 gap-1.5" onClick={() => setIsReminderModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> New Task
                </Button>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="space-y-2">
                  {isLoadingReminders ? (
                    <div className="flex justify-center py-6">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : reminders.length > 0 ? (
                    reminders.map((r) => {
                      const linkedLead = leads.find((l) => l.id === r.client_id);
                      return (
                        <div
                          key={r.id}
                          className={cn(
                            "flex items-start justify-between p-3 rounded-md border border-border transition-colors hover:bg-muted/30 group",
                            r.is_done ? "bg-muted/10 opacity-60" : "bg-card"
                          )}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <button
                              onClick={() => handleToggleReminder(r.id, r.is_done)}
                              className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                            >
                              {r.is_done ? (
                                <CheckCircle2 className="h-4.5 w-4.5 text-success fill-success/10" />
                              ) : (
                                <Circle className="h-4.5 w-4.5" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <p className={cn("text-sm font-medium", r.is_done && "line-through text-muted-foreground")}>
                                {r.title}
                              </p>
                              {r.notes && <p className="text-xs text-muted-foreground/90 mt-0.5">{r.notes}</p>}
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {new Date(r.due_at).toLocaleString()}
                                </span>
                                {linkedLead && (
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0 capitalize">
                                    Lead: {linkedLead.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger transition-opacity"
                            onClick={() => handleDeleteReminder(r.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-6">
                      No reminders due in the next 48 hours. Clear schedule!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Create Reminder Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card shadow-2xl">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle>Schedule Follow-up Task</CardTitle>
              <button onClick={() => setIsReminderModalOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </CardHeader>
            <form onSubmit={handleAddReminder}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Task Title *</label>
                  <Input
                    placeholder="e.g. Call to finalize contract pricing"
                    value={reminderForm.title}
                    onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Notes / Context</label>
                  <textarea
                    placeholder="Provide background info..."
                    value={reminderForm.notes}
                    onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Due Date & Time *</label>
                  <Input
                    type="datetime-local"
                    value={reminderForm.due_at}
                    onChange={(e) => setReminderForm({ ...reminderForm, due_at: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Link Client (Optional)</label>
                  <select
                    value={reminderForm.client_id}
                    onChange={(e) => setReminderForm({ ...reminderForm, client_id: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">No Client Linked</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 px-5 pb-5 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsReminderModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createReminderMutation.isPending}>
                  Add Task
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
