import type { Metadata } from "next";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import Link from "next/link";
import { ShieldCheck, RefreshCw, XCircle, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — GetYourClients",
  description: "Understand the GetYourClients 14-day refund guarantee, cancellation procedures, and Paddle billing policies.",
};

export default function RefundPolicyPage() {
  const lastUpdated = "September 10, 2026";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingNavbar />

      <main className="flex-1 py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          {/* Header */}
          <div className="border-b border-border pb-8">
            <span className="manifest-chip">CUSTOMER SATISFACTION</span>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Refund &amp; Cancellation Policy
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated: {lastUpdated} · Clear, transparent, and fair subscription terms
            </p>

            {/* Legal Navigation Tabs */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-sm">
                Refund & Cancellation
              </span>
              <Link
                href="/terms"
                className="inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/50"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/50"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Highlights Banner */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 shadow-subtle">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs text-foreground">14-Day Guarantee</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Full refund on your initial subscription if not satisfied.</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 shadow-subtle">
              <RefreshCw className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs text-foreground">1-Click Cancellation</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Cancel anytime from Settings &gt; Billing with zero penalty.</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 shadow-subtle">
              <XCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs text-foreground">No Lock-in</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Keep access until your current billing period concludes.</p>
              </div>
            </div>
          </div>

          {/* Policy Body */}
          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">1. Merchant of Record Disclosure</h2>
              <p>
                Our order process is conducted by our online reseller <strong>Paddle.com</strong>. Paddle.com is the <strong>Merchant of Record</strong> for all our orders. Paddle provides all customer service inquiries regarding billing and handles returns, refunds, and sales tax/VAT compliance.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">2. Subscription Cancellation Policy</h2>
              <p>
                We believe you should have complete control over your subscription. You may cancel your subscription at any time without needing to speak with a sales representative.
              </p>
              <div className="rounded-xl border border-border bg-card/60 p-4 text-xs space-y-2">
                <p className="font-semibold text-foreground">How to cancel your subscription:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Log in to your account at <Link href="/login" className="text-primary underline">https://getyourclientsb2b.com/login</Link>.</li>
                  <li>Navigate to <strong>Dashboard &gt; Settings &gt; Billing</strong>.</li>
                  <li>Click on <strong>&quot;Cancel Subscription&quot;</strong> or switch to the Free plan.</li>
                  <li>Confirm the cancellation.</li>
                </ol>
              </div>
              <p>
                <strong>Continued Access:</strong> Upon canceling, your subscription will not renew at the end of the current term. You and your team will retain complete access to all paid features and saved data until the end of your prepaid monthly or annual period.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">3. 14-Day Refund Eligibility</h2>
              <p>
                We stand behind the quality of GetYourClients. If you are a new customer and find that the platform does not meet your expectations, you are entitled to a full refund within <strong>14 calendar days</strong> of your initial subscription purchase.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Eligible:</strong> First-time purchases of any Growth, Pro, or Enterprise subscription tier requested within 14 days of checkout.</li>
                <li><strong>Technical Issues:</strong> If you experience verified platform defects or data indexing issues that our engineering team cannot resolve in a reasonable timeframe.</li>
                <li><strong>Ineligible:</strong> Excessive scraping or commercial extraction of our entire database prior to requesting a cancellation, or requests submitted after the 14-day window.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">4. How to Request a Refund</h2>
              <p>
                To request a refund, simply email our customer support team or Paddle with your details:
              </p>
              <div className="rounded-xl border border-border bg-card/60 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Email: support@getyourclientsb2b.com</span>
                </div>
                <p>Please include the following information:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your account email address</li>
                  <li>Paddle Transaction ID or Invoice Number (found on your payment receipt email from Paddle)</li>
                  <li>A brief note explaining why you are requesting a refund (to help us improve our product)</li>
                </ul>
              </div>
              <p>
                Our team reviews all refund requests promptly. Once approved, the refund is initiated via Paddle and credited back to your original payment method (credit card, PayPal, etc.) within <strong>3 to 5 business days</strong>, depending on your card issuer.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">5. Paddle Buyer Support</h2>
              <p>
                Because Paddle is the Merchant of Record, you can also contact Paddle directly regarding transaction receipts, invoice copies, or refund inquiries via their dedicated buyer portal at{" "}
                <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  paddle.net
                </a>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">6. Contact Information</h2>
              <div className="rounded-xl border border-border bg-card/60 p-4 text-xs space-y-1">
                <p><strong>GetYourClients, Inc. - Customer Support</strong></p>
                <p>Email: <a href="mailto:support@getyourclientsb2b.com" className="text-primary underline">support@getyourclientsb2b.com</a></p>
                <p>Support URL: <Link href="/contact" className="text-primary underline">https://getyourclientsb2b.com/contact</Link></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
