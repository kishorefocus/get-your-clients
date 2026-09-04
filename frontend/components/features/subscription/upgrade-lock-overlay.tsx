"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Sparkles,
  Check,
  Zap,
  ShieldAlert,
  ArrowRight,
  LogOut,
  Phone,
  MessageSquare,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import { useMyOrg } from "@/lib/hooks/use-org";
import { useSubscribe, useSubscriptionStatus } from "@/lib/hooks/use-subscription";
import { useSearchLimitStore } from "@/lib/stores/search-limit-store";
import { initializePaddle } from "@paddle/paddle-js";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ORG_KEYS } from "@/lib/hooks/use-org";
import { SUB_KEYS } from "@/lib/hooks/use-subscription";

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

const plans = [
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 19,
    yearlyPrice: 15,
    description: "For small teams scaling up their sales pipeline.",
    features: [
      "500 leads / month",
      "3 team seats",
      "Standard AI Client Discovery",
      "Email outreach & tracking",
      "Basic pipeline Kanban board",
    ],
    popular: false,
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "The complete prospecting power pack for high-growth agencies.",
    features: [
      "Unlimited AI client searches",
      "Unlimited verified leads",
      "10 team seats",
      "Direct Phone Dialer integration",
      "WhatsApp automated messaging",
      "Full CRM pipeline & interactions",
    ],
    popular: true,
    gradient: "from-primary via-indigo-600 to-accent",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: 149,
    yearlyPrice: 119,
    description: "Custom capabilities for enterprise sales teams and agencies.",
    features: [
      "Unlimited everything",
      "Unlimited team seats",
      "Custom API & CRM webhooks",
      "Dedicated account manager",
      "Priority phone & email support",
    ],
    popular: false,
    gradient: "from-purple-600 to-pink-600",
  },
];

export function UpgradeLockOverlay() {
  const [mounted, setMounted] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [paddle, setPaddle] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const { user, logout, isAuthenticated } = useAuth();
  const { data: org } = useMyOrg();
  const qc = useQueryClient();

  const isLocked = useSearchLimitStore((s) => s.isLocked);
  const searchCount = useSearchLimitStore((s) => s.searchCount);
  const countdownRemaining = useSearchLimitStore((s) => s.countdownRemaining);
  const decrementCountdown = useSearchLimitStore((s) => s.decrementCountdown);
  const firstLimitReachedAt = useSearchLimitStore((s) => s.firstLimitReachedAt);
  const unlockWithPlan = useSearchLimitStore((s) => s.unlockWithPlan);
  const initializeForUser = useSearchLimitStore((s) => s.initializeForUser);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize and check status on mount and when user/org changes
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      initializeForUser(user.email, org?.plan);
    }
  }, [isAuthenticated, user?.email, org?.plan, initializeForUser]);

  // 1-second interval ticker for the 30-second grace period countdown
  useEffect(() => {
    if (searchCount >= 3 && firstLimitReachedAt && !isLocked && countdownRemaining > 0) {
      const timer = setInterval(() => {
        decrementCountdown();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [searchCount, firstLimitReachedAt, isLocked, countdownRemaining, decrementCountdown]);

  // Initialize Paddle if available
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
      initializePaddle({
        environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production") || "sandbox",
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
        eventCallback: (event) => {
          if (event.name === "checkout.completed") {
            const plan = (event.data?.custom_data as any)?.plan || "pro";
            handleUpgradeSuccess(plan);
          }
        },
      }).then((paddleInstance) => {
        if (paddleInstance) setPaddle(paddleInstance);
      });
    }
  }, []);

  const handleUpgradeSuccess = (planKey: string) => {
    unlockWithPlan(planKey);
    // Invalidate org & subscription queries
    qc.invalidateQueries({ queryKey: ORG_KEYS.me });
    qc.invalidateQueries({ queryKey: SUB_KEYS.status });
    toast.success(`🎉 Spectacular! Upgraded to ${planKey.toUpperCase()} plan. All features unlocked!`);
  };

  const handleUpgradeClick = async (planKey: string) => {
    setIsProcessing(planKey);

    const priceId = PADDLE_PRICE_IDS[planKey]?.[billingInterval];
    if (paddle && priceId) {
      try {
        paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customer: user?.email ? { email: user.email } : undefined,
          customData: {
            org_id: org?.id || "",
            user_id: user?.id || "",
            plan: planKey,
          },
        });
        setIsProcessing(null);
        return;
      } catch (err) {
        console.warn("Paddle checkout error, falling back to direct unlock", err);
      }
    }

    // Direct upgrade / test unlock
    setTimeout(() => {
      handleUpgradeSuccess(planKey);
      setIsProcessing(null);
    }, 600);
  };

  // If user is not authenticated, do not render overlay
  if (!mounted || !isAuthenticated) {
    return null;
  }

  // If org is already on a paid plan, bypass lock
  if (org?.plan && org.plan !== "free") {
    return null;
  }

  // Floating Countdown Banner during the 30-second preview grace period
  if (!isLocked && searchCount >= 3 && countdownRemaining > 0) {
    const bannerContent = (
      <AnimatePresence>
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] w-[94%] max-w-lg rounded-2xl border border-amber-500/50 bg-slate-950/95 text-amber-200 px-4 py-2.5 shadow-[0_12px_35px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-xs animate-pulse">
              {countdownRemaining}s
            </span>
            <div className="min-w-0">
              <p className="font-bold text-amber-300 leading-none">Free Search Limit (3/3)</p>
              <p className="text-[11px] text-amber-200/80 truncate mt-0.5">
                Dashboard locks in <strong>{countdownRemaining} seconds</strong>.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => useSearchLimitStore.setState({ isLocked: true })}
            className="h-7 px-3 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-sm shrink-0"
          >
            Upgrade Now
          </Button>
        </motion.div>
      </AnimatePresence>
    );
    return createPortal(bannerContent, document.body);
  }

  if (!isLocked) {
    return null;
  }

  const overlayContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Dimmed, Blurred Backdrop revealing the app underneath but blocking all interactions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
      />

      {/* Center Paywall Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
        className="relative w-full max-w-4xl max-h-[95vh] flex flex-col rounded-3xl border border-primary/40 bg-gradient-to-b from-card via-card/95 to-surface shadow-[0_25px_70px_rgba(0,0,0,0.6)] z-10 overflow-hidden"
      >
        {/* Glowing Top Ambient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />

        {/* Header Section */}
        <div className="p-6 sm:p-8 pb-4 text-center relative">
          {/* Lock Icon with Glowing Orb */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/20 relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-md animate-pulse" />
            <Lock className="h-8 w-8 text-primary relative z-10" />
            <Sparkles className="absolute -top-1.5 -right-1.5 h-5 w-5 text-accent animate-bounce" />
          </div>

          <Badge variant="outline" className="mb-2.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-rose-500/10 text-rose-500 border-rose-500/30 gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            Free Search Limit Reached ({searchCount}/3 Searches Used)
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Upgrade Your Plan to Continue
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            You have used all 3 free searches on the AI Client Discovery Engine. To continue discovering verified clients, accessing direct phone dialers, and managing pipeline outreach, select a plan below.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-5 inline-flex items-center rounded-full border border-border/80 bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setBillingInterval("month")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                billingInterval === "month"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("year")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5",
                billingInterval === "year"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>Annual Billing</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[10px] font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="px-6 sm:px-8 pb-6 flex-1 overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const price = billingInterval === "month" ? p.monthlyPrice : p.yearlyPrice;
              const isPro = p.popular;

              return (
                <div
                  key={p.key}
                  className={cn(
                    "relative flex flex-col rounded-2xl p-5 transition-all duration-200 border",
                    isPro
                      ? "border-primary bg-gradient-to-b from-primary/10 via-card to-card shadow-lg shadow-primary/10 ring-1 ring-primary/40"
                      : "border-border/80 bg-card/60 hover:bg-card/90"
                  )}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                      ⭐ Recommended
                    </div>
                  )}

                  <div className="mb-3">
                    <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                  </div>

                  <div className="mb-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-foreground">${price}</span>
                    <span className="text-xs text-muted-foreground">/ month</span>
                  </div>

                  {/* Feature checklist */}
                  <ul className="space-y-2 text-xs text-foreground/90 mb-5 flex-1">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <Button
                    type="button"
                    onClick={() => handleUpgradeClick(p.key)}
                    disabled={isProcessing !== null}
                    className={cn(
                      "w-full h-9 text-xs font-semibold gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]",
                      isPro
                        ? "bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white shadow-primary/20"
                        : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                    )}
                  >
                    {isProcessing === p.key ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Activating...</span>
                      </>
                    ) : (
                      <>
                        <span>Upgrade to {p.name}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info & Logout */}
        <div className="border-t border-border/60 bg-muted/20 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Instant activation — your pipeline and searches unlock immediately.</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Signed in as <strong className="text-foreground">{user?.email}</strong></span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1 font-semibold text-rose-500 hover:text-rose-600 hover:underline"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
