"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, HelpCircle, Shield, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const pricingPlans = [
  {
    key: "free",
    name: "Free",
    description: "Perfect for testing lead discovery and exploring global market coverage.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "3 free verified leads",
      "1 team seat",
      "Basic global searches",
      "Standard CRM pipeline",
      "Community support",
    ],
    popular: false,
    ctaText: "Start for free",
    ctaLink: "/signup",
    variant: "outline" as const,
  },
  {
    key: "growth",
    name: "Growth",
    description: "For individual sales reps and consultants growing their outbound pipeline.",
    monthlyPrice: 19,
    yearlyPrice: 15,
    features: [
      "500 verified leads / month",
      "3 team seats included",
      "Standard AI Discovery",
      "Email outreach integration",
      "Standard analytics & export",
      "Standard email support",
    ],
    popular: false,
    ctaText: "Choose Growth",
    ctaLink: "/signup?plan=growth",
    variant: "outline" as const,
  },
  {
    key: "pro",
    name: "Pro",
    description: "For fast-scaling sales teams who need high volume and automated discovery.",
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: [
      "Unlimited verified leads",
      "10 team seats included",
      "AI Persona Discovery Engine",
      "Call + email outreach suite",
      "Full analytics & reporting",
      "Priority customer support",
    ],
    popular: true,
    ctaText: "Upgrade to Pro",
    ctaLink: "/signup?plan=pro",
    variant: "default" as const,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "For organizations demanding custom integrations, maximum seats, and dedicated SLAs.",
    monthlyPrice: 149,
    yearlyPrice: 119,
    features: [
      "Unlimited everything",
      "Unlimited team seats",
      "Custom API Integrations",
      "Dedicated account manager",
      "Single Sign-On (SSO / SAML)",
      "99.9% Uptime SLA",
    ],
    popular: false,
    ctaText: "Choose Enterprise",
    ctaLink: "/signup?plan=enterprise",
    variant: "outline" as const,
  },
];

const faqs = [
  {
    q: "How does billing and subscription renewal work?",
    a: "All paid plans (Growth, Pro, Enterprise) are billed as recurring subscriptions, either monthly or annually based on your selection. Your subscription automatically renews at the start of each billing period unless canceled.",
  },
  {
    q: "Who processes my payments?",
    a: "Our orders and payments are conducted by Paddle.com, our authorized Merchant of Record. Paddle handles all global payment processing, automated VAT/sales tax calculation, and PCI-DSS compliant secure checkouts.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes. You can cancel your subscription at any time with a single click from your account dashboard under Settings > Billing. When you cancel, your account remains active with full access until the end of your paid billing period.",
  },
  {
    q: "What is your refund policy?",
    a: "We offer a 14-day money-back guarantee for first-time subscriptions. If you are not satisfied with GetYourClients, contact us within 14 days of your initial purchase for a full refund. Please review our Refund & Cancellation Policy for full details.",
  },
  {
    q: "What payment methods are supported?",
    a: "Through Paddle, we accept major credit and debit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, and Google Pay, depending on your region and currency.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes! You can upgrade or downgrade your plan at any time directly in your account dashboard. Prorated adjustments will be automatically calculated.",
  },
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingNavbar />

      <main className="flex-1 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="manifest-chip">TRANSPARENT B2B PRICING</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Simple plans for ambitious <span className="gradient-text">sales teams</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Find verified decision-makers across 190+ countries. Choose the plan that fits your growth stage. No hidden fees or long-term lock-in.
            </p>

            {/* Billing interval toggle */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <span className={cn("text-sm font-medium", billingInterval === "month" ? "text-foreground" : "text-muted-foreground")}>
                Monthly billing
              </span>
              <button
                type="button"
                onClick={() => setBillingInterval(billingInterval === "month" ? "year" : "month")}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-muted transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                role="switch"
                aria-checked={billingInterval === "year"}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-primary shadow-lg ring-0 transition duration-200 ease-in-out",
                    billingInterval === "year" ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-medium", billingInterval === "year" ? "text-foreground" : "text-muted-foreground")}>
                  Yearly billing
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold">
                  Save ~20%
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pricingPlans.map((plan) => {
              const price = billingInterval === "month" ? plan.monthlyPrice : plan.yearlyPrice;
              return (
                <div
                  key={plan.key}
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-6 bg-card transition-all duration-200",
                    plan.popular
                      ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary"
                      : "border-border shadow-subtle hover:border-border/80"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
                        <Sparkles className="h-3 w-3" /> Most Popular
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                    <p className="mt-2 text-xs text-muted-foreground min-h-[32px]">
                      {plan.description}
                    </p>

                    <div className="mt-6 flex items-baseline">
                      <span className="font-display text-4xl font-extrabold tracking-tight">
                        ${price}
                      </span>
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        / month {billingInterval === "year" && price > 0 && "(billed annually)"}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs text-muted-foreground flex-1 border-t border-border pt-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 pt-4">
                    <Link href={plan.ctaLink} className="block w-full">
                      <Button
                        variant={plan.variant}
                        className={cn(
                          "w-full font-semibold",
                          plan.popular && "shadow-lg shadow-primary/25"
                        )}
                      >
                        {plan.ctaText}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Security & Merchant of Record Strip */}
          <div className="mt-16 rounded-2xl border border-border bg-card/60 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Secure Payments Powered by Paddle</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paddle.com is our Merchant of Record. All checkouts are 256-bit encrypted, PCI-DSS Level 1 compliant, and support local currencies.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded bg-muted/70 font-mono text-[11px]">Visa</span>
              <span className="px-2 py-1 rounded bg-muted/70 font-mono text-[11px]">Mastercard</span>
              <span className="px-2 py-1 rounded bg-muted/70 font-mono text-[11px]">Amex</span>
              <span className="px-2 py-1 rounded bg-muted/70 font-mono text-[11px]">PayPal</span>
              <span className="px-2 py-1 rounded bg-muted/70 font-mono text-[11px]">Apple Pay</span>
            </div>
          </div>

          {/* FAQs Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="text-center">
              <span className="manifest-chip">QUESTIONS & ANSWERS</span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card p-5 shadow-subtle"
                >
                  <h3 className="font-semibold text-sm text-foreground flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{faq.q}</span>
                  </h3>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
