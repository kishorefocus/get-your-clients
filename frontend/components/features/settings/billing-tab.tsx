"use client";

import { useMyOrg } from "@/lib/hooks/use-org";
import { useSubscribe, useCancelSubscription } from "@/lib/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerChild, cardHoverProps } from "@/lib/motion";

const planList = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    features: ["3 free leads", "1 seat", "Basic searches", "Standard CRM pipeline"],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$49",
    features: ["Unlimited leads", "10 seats", "AI Persona Discovery", "Call + email outreach", "Full analytics"],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$149",
    features: ["Unlimited everything", "Unlimited seats", "Custom API Integrations", "Dedicated manager", "SSO"],
  },
];

const invoices = [
  { id: "INV-2026-08", date: "Aug 1, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-07", date: "Jul 1, 2026", amount: "$49.00", status: "Paid" },
];

export function BillingTab() {
  const { data: org, isLoading } = useMyOrg();
  const subscribeMutation = useSubscribe();
  const cancelMutation = useCancelSubscription();

  const currentPlanKey = org?.plan || "free";

  const handleAction = async (planKey: string) => {
    if (planKey === "free") {
      if (confirm("Are you sure you want to cancel your subscription and return to the Free plan? You will only see 3 lead details.")) {
        cancelMutation.mutate();
      }
    } else {
      subscribeMutation.mutate(planKey);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const maxLeads = currentPlanKey === "free" ? 3 : currentPlanKey === "pro" ? 5000 : 99999;
  const maxSeats = currentPlanKey === "free" ? 1 : currentPlanKey === "pro" ? 10 : 999;
  
  const usage = [
    { label: "Seats", used: 1, limit: maxSeats },
    { label: "Unlocked Leads", used: currentPlanKey === "free" ? 3 : 124, limit: maxLeads },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-2xl"
    >
      {/* Plans */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Subscription Plan</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {planList.map((plan) => {
            const isCurrent = currentPlanKey === plan.key;
            const isUpgrading = subscribeMutation.isPending && subscribeMutation.variables === plan.key;
            const isCancelling = cancelMutation.isPending && plan.key === "free";

            return (
              <motion.div
                key={plan.key}
                variants={staggerChild}
                {...cardHoverProps}
                className={`relative rounded-xl border p-4 hover:shadow-card transition-shadow ${
                  isCurrent ? "border-primary ring-2 ring-primary/20 bg-primary/[0.01]" : "border-border bg-card"
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Current Plan
                  </span>
                )}
                <p className="font-display text-base font-bold">{plan.name}</p>
                <p className="mt-0.5 font-mono text-xl font-semibold">
                  {plan.price}
                  <span className="text-xs text-muted-foreground">/mo</span>
                </p>
                <ul className="mt-3 space-y-1.5 min-h-[110px]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-success shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                
                {!isCurrent ? (
                  <Button
                    size="sm"
                    variant={plan.key === "enterprise" ? "outline" : "default"}
                    className="mt-4 w-full text-xs"
                    onClick={() => handleAction(plan.key)}
                    disabled={subscribeMutation.isPending || cancelMutation.isPending}
                  >
                    {isUpgrading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      plan.key === "enterprise" ? "Contact sales" : "Upgrade"
                    )}
                  </Button>
                ) : (
                  plan.key !== "free" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-4 w-full text-xs text-danger hover:bg-danger/10"
                      onClick={() => handleAction("free")}
                      disabled={subscribeMutation.isPending || cancelMutation.isPending}
                    >
                      {isCancelling ? (
                        <Loader2 className="h-3 w-3 animate-spin text-danger" />
                      ) : (
                        "Cancel Subscription"
                      )}
                    </Button>
                  )
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Usage */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Plan Usage</h3>
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          {usage.map((u) => (
            <div key={u.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium">{u.label}</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {u.used} / {u.limit === 999 ? "∞" : u.limit}
                </span>
              </div>
              <Progress value={(u.used / u.limit) * 100} />
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      {currentPlanKey !== "free" && (
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
      )}
    </motion.div>
  );
}
