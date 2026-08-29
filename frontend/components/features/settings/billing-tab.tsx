"use client";

import { useState, useEffect } from "react";
import { useMyOrg } from "@/lib/hooks/use-org";
import { useSubscribe, useCancelSubscription, useSubscriptionStatus } from "@/lib/hooks/use-subscription";
import { useAuth } from "@/lib/hooks/use-auth";
import { initializePaddle } from "@paddle/paddle-js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Loader2, FileText, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerChild, cardHoverProps } from "@/lib/motion";
import { toast } from "sonner";

const PADDLE_PRICE_IDS: Record<string, { month: string; year: string }> = {
  growth: {
    month: "pri_01m15xs0trk9mmkrd5b7pfr5cw",
    year: "pri_01m1676haan7wtzgnvbzv364yn",
  },
  pro: {
    month: "pri_01m167efhpd1bhe9pfx24m8fcm",
    year: "pri_01m167fp4ccv5svj2r01fnk7cr",
  },
  enterprise: {
    month: "pri_01m167hq9j3kncjcs4nfwv86y8",
    year: "pri_01m167kab9hhetzkwbd96jsj28",
  },
};


const planList = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["3 free leads", "1 seat", "Basic searches", "Standard CRM pipeline"],
    popular: false,
  },
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 19,
    yearlyPrice: 15,
    features: ["500 leads/mo", "3 seats", "Standard AI Discovery", "Email outreach", "Standard analytics"],
    popular: false,
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: ["Unlimited leads", "10 seats", "AI Persona Discovery", "Call + email outreach", "Full analytics"],
    popular: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: 149,
    yearlyPrice: 119,
    features: ["Unlimited everything", "Unlimited seats", "Custom API Integrations", "Dedicated manager", "SSO"],
    popular: false,
  },
];

const invoices = [
  { id: "INV-2026-08", date: "Aug 1, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-07", date: "Jul 1, 2026", amount: "$49.00", status: "Paid" },
];

export function BillingTab() {
  const { user } = useAuth();
  const { data: org, isLoading: isOrgLoading } = useMyOrg();
  const { data: subscription, isLoading: isSubLoading } = useSubscriptionStatus();
  const subscribeMutation = useSubscribe();
  const cancelMutation = useCancelSubscription();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [paddle, setPaddle] = useState<any>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

  const currentPlanKey = org?.plan || "free";
  const isLoading = isOrgLoading || isSubLoading;

  useEffect(() => {
    initializePaddle({
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production") || "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
      eventCallback: (event) => {
        if (event.name === "checkout.completed") {
          const transactionId = event.data?.transaction_id;
          const plan = (event.data?.custom_data as any)?.plan || "growth";
          window.location.href = `/success?transaction_id=${transactionId}&plan=${plan}`;
        }
      }
    }).then((paddleInstance) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    });
  }, []);

  const handleAction = async (planKey: string) => {
    if (planKey === "free") {
      if (confirm("Are you sure you want to cancel your subscription and return to the Free plan? You will only see 3 lead details.")) {
        cancelMutation.mutate();
      }
    } else {
      const priceId = PADDLE_PRICE_IDS[planKey]?.[billingInterval];
      if (!priceId) {
        toast.error("Invalid plan or billing interval.");
        return;
      }
      if (!paddle) {
        toast.error("Paddle is not ready yet. Please try again in a moment.");
        return;
      }
      try {
        setIsCheckoutLoading(planKey);
        localStorage.setItem("pending_plan", planKey);
        paddle.Checkout.open({
          items: [
            {
              priceId: priceId,
              quantity: 1,
            },
          ],
          customer: user?.email ? { email: user.email } : undefined,
          customData: {
            org_id: user?.org_id || "",
            user_id: user?.id || "",
            plan: planKey,
          },
        });
      } catch (err: any) {
        toast.error(err.message || "Failed to open checkout overlay.");
      } finally {
        setIsCheckoutLoading(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const maxLeads = currentPlanKey === "free"
    ? 3
    : currentPlanKey === "growth"
    ? 500
    : currentPlanKey === "pro"
    ? 5000
    : 99999;

  const maxSeats = currentPlanKey === "free"
    ? 1
    : currentPlanKey === "growth"
    ? 3
    : currentPlanKey === "pro"
    ? 10
    : 999;

  const usage = [
    { label: "Seats", used: 1, limit: maxSeats },
    { label: "Unlocked Leads", used: currentPlanKey === "free" ? 3 : 124, limit: maxLeads },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8 w-full max-w-5xl"
    >
      {/* Plans Section */}
      <div>
        <div className="flex flex-col items-center justify-between gap-4 mb-8 sm:flex-row">
          <div>
            <h3 className="text-base font-bold text-foreground">Choose your subscription plan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Scale your CRM as your outbound pipeline grows.</p>
          </div>

          {/* Premium Billing Interval Toggle */}
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/40 w-fit">
            <button
              type="button"
              onClick={() => setBillingInterval("month")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all relative ${
                billingInterval === "month"
                  ? "text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {billingInterval === "month" && (
                <motion.div
                  layoutId="active-billing-interval"
                  className="absolute inset-0 rounded-md bg-primary z-0 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">Monthly</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("year")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all relative ${
                billingInterval === "year"
                  ? "text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {billingInterval === "year" && (
                <motion.div
                  layoutId="active-billing-interval"
                  className="absolute inset-0 rounded-md bg-primary z-0 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                Yearly
                <Badge className="bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[9px] px-1 py-0 shrink-0 font-bold">
                  Save 20%
                </Badge>
              </span>
            </button>
          </div>
        </div>

        {/* 4 Plans Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {planList.map((plan) => {
            const isCurrent =
              currentPlanKey === plan.key &&
              (plan.key === "free" ||
                (subscription?.billing_interval || "month") === billingInterval);
            const isUpgrading = isCheckoutLoading === plan.key;
            const isCancelling = cancelMutation.isPending && plan.key === "free";

            const activePrice = billingInterval === "month" ? plan.monthlyPrice : plan.yearlyPrice;

            return (
              <motion.div
                key={plan.key}
                variants={staggerChild}
                {...cardHoverProps}
                className={`relative flex flex-col justify-between rounded-xl border p-5 hover:shadow-card transition-shadow ${
                  isCurrent
                    ? "border-primary ring-2 ring-primary/20 bg-primary/[0.01]"
                    : plan.popular
                    ? "border-primary/50 shadow-md shadow-primary/[0.02] bg-card"
                    : "border-border/60 bg-card"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && !isCurrent && (
                  <span className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow-sm">
                    <Zap className="h-2.5 w-2.5 fill-current" /> Most Popular
                  </span>
                )}

                {/* Current plan badge */}
                {isCurrent && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                    Active Plan
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base font-extrabold text-foreground">{plan.name}</p>
                  </div>
                  
                  {/* Dynamic Price Display */}
                  <div className="mt-2">
                    <p className="font-mono text-2xl font-extrabold tracking-tight text-foreground">
                      ${activePrice}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </p>
                    {billingInterval === "year" && activePrice > 0 && (
                      <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
                        Billed annually (${activePrice * 12}/yr)
                      </p>
                    )}
                  </div>

                  <ul className="mt-4 space-y-2 min-h-[140px]">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground leading-normal">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-3 border-t border-border/40">
                  {!isCurrent ? (
                    <Button
                      type="button"
                      size="sm"
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full text-xs font-semibold"
                      onClick={() => handleAction(plan.key)}
                      disabled={!!isCheckoutLoading || cancelMutation.isPending}
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
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="w-full text-xs text-danger hover:bg-danger/10"
                        onClick={() => handleAction("free")}
                        disabled={!!isCheckoutLoading || cancelMutation.isPending}
                      >
                        {isCancelling ? (
                          <Loader2 className="h-3 w-3 animate-spin text-danger" />
                        ) : (
                          "Cancel Subscription"
                        )}
                      </Button>
                    )
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Usage Section */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Plan Usage</h3>
        <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          {usage.map((u) => (
            <div key={u.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground">{u.label}</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {u.used} / {u.limit === 999 ? "∞" : u.limit}
                </span>
              </div>
              <Progress value={Math.min((u.used / u.limit) * 100, 100)} />
            </div>
          ))}
        </div>
      </div>

      {/* Invoices Section */}
      {currentPlanKey !== "free" && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Invoice history</h3>
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between border-b border-border/40 last:border-b-0 px-4 py-3 bg-card/65">
                <div>
                  <p className="text-sm font-mono font-semibold text-foreground">{inv.id}</p>
                  <p className="text-[11px] text-muted-foreground">{inv.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-foreground">{inv.amount}</span>
                  <Badge variant="success" className="text-[10px]">{inv.status}</Badge>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2 hover:bg-muted/65">
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
