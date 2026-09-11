import type { Metadata } from "next";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — GetYourClients",
  description: "Read the GetYourClients Privacy Policy. Learn how we collect, handle, and safeguard your data under GDPR & CCPA.",
};

export default function PrivacyPage() {
  const lastUpdated = "September 10, 2026";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingNavbar />

      <main className="flex-1 py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          {/* Header */}
          <div className="border-b border-border pb-8">
            <span className="manifest-chip">DATA PRIVACY & SECURITY</span>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated: {lastUpdated} · GDPR &amp; CCPA Compliant
            </p>

            {/* Legal Navigation Tabs */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-sm">
                Privacy Policy
              </span>
              <Link
                href="/terms"
                className="inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/50"
              >
                Terms of Service
              </Link>
              <Link
                href="/refund"
                className="inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/50"
              >
                Refund & Cancellation
              </Link>
            </div>
          </div>

          {/* Policy Body */}
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">1. Overview</h2>
              <p>
                GetYourClients (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the website{" "}
                <Link href="/" className="text-primary underline">https://getyourclientsb2b.com</Link> and associated B2B sales intelligence software. We are dedicated to maintaining the privacy, confidentiality, and security of the personal information of our users and visitors.
              </p>
              <p>
                This Privacy Policy explains what personal data we collect, how it is processed, with whom it is shared, and how you can exercise your privacy rights under applicable regulations such as the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">2. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account Information:</strong> When you sign up, we collect your name, business email address, company name, and password hash.
                </li>
                <li>
                  <strong>Billing &amp; Payment Data:</strong> Payment card details and billing addresses are collected and processed securely directly by our Merchant of Record, <strong>Paddle.com</strong>. We do not store or process raw credit card numbers on our servers.
                </li>
                <li>
                  <strong>Platform Usage &amp; Log Data:</strong> Information such as your IP address, browser user-agent, operating system, and feature interactions to monitor service reliability and prevent fraud.
                </li>
                <li>
                  <strong>Third-Party Authentication:</strong> If you choose to sign in via Google OAuth, we receive your basic Google profile name, email, and avatar.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">3. How We Use Your Information</h2>
              <p>We process your data for the following legitimate business purposes:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To provision and maintain your user account and SaaS workspaces.</li>
                <li>To enable search and pipeline tracking features within the application.</li>
                <li>To process payments and manage recurring subscription renewals through Paddle.</li>
                <li>To send operational announcements, service updates, and billing receipts.</li>
                <li>To ensure compliance with security protocols and prevent abusive behavior.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">4. Third-Party Service Providers and Processors</h2>
              <p>We work with trusted third-party providers to operate our cloud infrastructure:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Paddle.com (Merchant of Record):</strong> Handles all checkout processes, invoice issuance, tax compliance, and payment security. You can read Paddle&apos;s privacy policy at{" "}
                  <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    paddle.com/legal/privacy
                  </a>.
                </li>
                <li>
                  <strong>Hosting &amp; Compute:</strong> Cloud providers (including Vercel and Railway) for hosting backend services and web assets.
                </li>
                <li>
                  <strong>Transactional Email:</strong> Resend for delivering system notifications and password resets.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">5. Your Data Protection Rights (GDPR &amp; CCPA)</h2>
              <p>Depending on your jurisdiction, you have the following rights:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Right of Access:</strong> Request a copy of the personal information we hold about you.</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete records.</li>
                <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your personal data.</li>
                <li><strong>Right to Restrict or Object:</strong> Restrict processing or object to our use of your information.</li>
                <li><strong>Right to Data Portability:</strong> Obtain your data in a structured, machine-readable format.</li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, please email us at{" "}
                <a href="mailto:privacy@getyourclientsb2b.com" className="text-primary underline">
                  privacy@getyourclientsb2b.com
                </a>{" "}
                or{" "}
                <a href="mailto:support@getyourclientsb2b.com" className="text-primary underline">
                  support@getyourclientsb2b.com
                </a>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">6. Cookies and Tracking Technologies</h2>
              <p>
                We use strictly necessary cookies to maintain your login session and secure your browsing experience. We do not sell your personal data or track your behavior across unaffiliated third-party websites.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">7. Contact the Data Protection Team</h2>
              <p>
                If you have questions, feedback, or requests regarding this Privacy Policy, please reach out to us:
              </p>
              <div className="rounded-xl border border-border bg-card/60 p-4 text-xs space-y-1">
                <p><strong>GetYourClients, Inc. - Privacy Operations</strong></p>
                <p>Email: <a href="mailto:privacy@getyourclientsb2b.com" className="text-primary underline">privacy@getyourclientsb2b.com</a></p>
                <p>Support: <a href="mailto:support@getyourclientsb2b.com" className="text-primary underline">support@getyourclientsb2b.com</a></p>
                <p>Website: <Link href="/" className="text-primary underline">https://getyourclientsb2b.com</Link></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
