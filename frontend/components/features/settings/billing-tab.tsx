"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Building2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerChild, cardHoverProps, tapProps } from "@/lib/motion";

const plans = [
  {
    name: "Starter",
    price: "$49",
    features: ["3 seats", "500 leads/mo", "Email outreach", "Basic analytics"],
    current: false,
  },
  {
    name: "Growth",
    price: "$149",
    features: ["10 seats", "5,000 leads/mo", "Email + Call outreach", "Full analytics", "Pipeline CRM"],
    current: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["Unlimited seats", "Unlimited leads", "Dedicated support", "Custom integrations", "SSO"],
    current: false,
  },
];

const usage = [
  { label: "Seats", used: 6, limit: 10 },
  { label: "Leads this month", used: 2481, limit: 5000 },
  { label: "Outreach sent", used: 914, limit: 2000 },
];

const invoices = [
  { id: "INV-2026-08", date: "Aug 1, 2026", amount: "$149.00", status: "Paid" },
  { id: "INV-2026-07", date: "Jul 1, 2026", amount: "$149.00", status: "Paid" },
  { id: "INV-2026-06", date: "Jun 1, 2026", amount: "$149.00", status: "Paid" },
];

export function BillingTab() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-2xl"
    >
      {/* Plans */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Current Plan</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={staggerChild}
              {...cardHoverProps}
              className={`relative rounded-xl border p-4 hover:shadow-card transition-shadow ${
                plan.current ? "border-primary ring-2 ring-primary/20 bg-primary/[0.01]" : "border-border bg-card"
              }`}
            >
              {plan.current && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  Current
                </span>
              )}
              <p className="font-display text-base font-bold">{plan.name}</p>
              <p className="mt-0.5 font-mono text-xl font-semibold">{plan.price}<span className="text-xs text-muted-foreground">/mo</span></p>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {!plan.current && (
                <Button size="sm" variant={plan.name === "Enterprise" ? "ghost" : "default"} className="mt-4 w-full text-xs">
                  {plan.name === "Enterprise" ? "Contact sales" : "Upgrade"}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Usage */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Usage this month</h3>
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          {usage.map((u) => (
            <div key={u.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium">{u.label}</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {u.used.toLocaleString()} / {u.limit.toLocaleString()}
                </span>
              </div>
              <Progress value={(u.used / u.limit) * 100} />
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Invoice history</h3>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between border-b border-border last:border-b-0 px-4 py-3">
              <div>
                <p className="text-sm font-mono font-semibold">{inv.id}</p>
                <p className="text-[11px] text-muted-foreground">{inv.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm">{inv.amount}</span>
                <Badge variant="success" className="text-[10px]">{inv.status}</Badge>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2">
                  <FileText className="h-3 w-3" /> PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
