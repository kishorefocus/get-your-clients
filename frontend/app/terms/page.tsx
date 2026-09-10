import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import Link from "next/link";

export default function TermsPage() {
  const lastUpdated = "September 10, 2026";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingNavbar />

      <main className="flex-1 py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          {/* Header */}
          <div className="border-b border-border pb-8">
            <span className="manifest-chip">LEGAL AGREEMENT</span>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated: {lastUpdated} · Effective immediately
            </p>
          </div>

          {/* Document Content */}
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">1. Introduction and Agreement</h2>
              <p>
                Welcome to <strong>GetYourClients</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), available via{" "}
                <Link href="https://getyourclientsb2b.com" className="text-primary underline">
                  https://getyourclientsb2b.com
                </Link>{" "}
                and associated services. By registering an account, accessing, or using our platform, you agree to be bound by these Terms of Service (&quot;Terms&quot;).
              </p>
              <p>
                If you are entering into this agreement on behalf of a company or legal entity, you represent that you have the authority to bind such entity to these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">2. Description of the Service</h2>
              <p>
                GetYourClients provides an AI-assisted B2B client discovery, lead management, and global sales pipeline software platform. Our tools allow registered users to identify publicly accessible corporate business details, track sales opportunities, and orchestrate outreach activities across international markets.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">3. Account Registration and Security</h2>
              <p>
                You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your login credentials and are solely responsible for all activities occurring under your account. You must notify us immediately at{" "}
                <a href="mailto:support@getyourclientsb2b.com" className="text-primary underline">
                  support@getyourclientsb2b.com
                </a>{" "}
                if you suspect unauthorized access.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">4. Subscriptions, Billing, and Merchant of Record</h2>
              <div className="rounded-xl border border-border bg-card/60 p-4 text-xs space-y-2">
                <p className="font-semibold text-foreground">Notice Regarding Payment Processing (Paddle):</p>
                <p>
                  Our order process is conducted by our online reseller <strong>Paddle.com</strong>. Paddle.com is the <strong>Merchant of Record</strong> for all our orders. Paddle provides customer service inquiries regarding billing and handles returns, invoicing, and applicable local sales tax or Value Added Tax (VAT).
                </p>
              </div>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  <strong>Recurring Billing:</strong> Paid subscriptions (such as Growth, Pro, and Enterprise) are billed on a recurring periodic basis (monthly or annually) according to your selected plan.
                </li>
                <li>
                  <strong>Automatic Renewal:</strong> Unless canceled prior to the end of the current billing cycle, your subscription will automatically renew at the then-prevailing subscription fee using the payment method on file with Paddle.
                </li>
                <li>
                  <strong>Cancellation:</strong> You may cancel your subscription at any time directly through your account dashboard under <em>Settings &gt; Billing</em>. Cancellation takes effect at the conclusion of your current paid billing period.
                </li>
                <li>
                  <strong>Refunds:</strong> Refund requests are governed by our dedicated <Link href="/refund" className="text-primary underline">Refund & Cancellation Policy</Link>.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">5. Acceptable Use and Compliance</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Use the platform in violation of any applicable local, national, or international privacy laws (including CAN-SPAM, GDPR, and CASL).</li>
                <li>Transmit unsolicited bulk emails (spam), fraudulent materials, or malicious software.</li>
                <li>Reverse-engineer, scrape without authorization, or compromise the technical infrastructure of the platform.</li>
                <li>Resell, sublicense, or redistribute our raw lead database without prior express written consent.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">6. Intellectual Property Rights</h2>
              <p>
                The platform, including all user interfaces, software code, proprietary algorithms, documentation, logos, and visual design elements, is and remains the exclusive property of GetYourClients, Inc. and its licensors.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">7. Disclaimer of Warranties and Limitation of Liability</h2>
              <p>
                THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, GETYOURCLIENTS AND ITS RESELLER PADDLE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">8. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account if you breach these Terms. You may terminate your account at any time by contacting our support team or deleting your workspace.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-bold text-foreground">9. Contact Us</h2>
              <p>
                If you have questions regarding these Terms of Service, please contact us:
              </p>
              <div className="rounded-xl border border-border bg-card/60 p-4 text-xs space-y-1">
                <p><strong>GetYourClients, Inc.</strong></p>
                <p>Email: <a href="mailto:support@getyourclientsb2b.com" className="text-primary underline">support@getyourclientsb2b.com</a></p>
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
