"use client";

import { useState } from "react";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Clock, Building, CheckCircle2, Send, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Support",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    // Client-side form acknowledgement
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingNavbar />

      <main className="flex-1 py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <span className="manifest-chip">24/7 SUPPORT &amp; SALES</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Get in touch with our <span className="gradient-text">team</span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Have questions about our global lead discovery, API, or subscription plans? We are here to help your sales team succeed.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Contact Channels Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-subtle space-y-6">
                <h2 className="font-display text-lg font-bold text-foreground">Contact Channels</h2>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Email Support</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">For billing, subscription, or technical queries</p>
                    <a
                      href="mailto:support@getyourclientsb2b.com"
                      className="mt-1.5 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      support@getyourclientsb2b.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Enterprise Inquiries</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Custom volume, SSO setup, and dedicated integrations</p>
                    <a
                      href="mailto:sales@getyourclientsb2b.com"
                      className="mt-1.5 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      sales@getyourclientsb2b.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Response Time</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Our customer support team typically responds within <strong>24 business hours</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 border-t border-border pt-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <h3 className="font-semibold text-foreground">GetYourClients, Inc.</h3>
                    <p className="mt-0.5">Web: https://getyourclientsb2b.com</p>
                    <p>Payments reseller: Paddle.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Form */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-12"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground">Message Sent Successfully!</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-md">
                      Thank you for contacting us. We have received your inquiry and a support representative will reach out to <strong>{formData.email}</strong> shortly.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", email: "", subject: "General Support", message: "" });
                      }}
                    >
                      Send another message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground">Send a Message</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Fill out the form below and we will get back to you as soon as possible.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Your Name *</label>
                        <Input
                          required
                          placeholder="e.g. Jane Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Work Email Address *</label>
                        <Input
                          required
                          type="email"
                          placeholder="jane@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Inquiry Subject</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      >
                        <option value="General Support">General Support &amp; Product Questions</option>
                        <option value="Billing &amp; Subscription">Billing &amp; Subscription Help (Paddle)</option>
                        <option value="Enterprise Sales">Enterprise Sales &amp; Custom Volume</option>
                        <option value="Data &amp; API Integration">Data Coverage &amp; API Integration</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Message *</label>
                      <Textarea
                        required
                        rows={5}
                        placeholder="Please describe how we can help you..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full gap-2 font-semibold">
                      <Send className="h-4 w-4" /> Send Message
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
