"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Globe2, CheckCircle2, Shield, Eye, EyeOff, Loader2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useId, useEffect, Suspense } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { scaleIn, staggerContainer, staggerChild, springUI, EASE_OUT } from "@/lib/motion";
import { verifyInviteToken, acceptInvite, VerifyInvitationResponse } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { mockLeads } from "@/lib/mock/leads";

const InteractiveMap = dynamic(
  () => import("@/components/features/search/interactive-map").then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-[hsl(224,33%,7%)] animate-pulse">
        <span className="text-xs text-muted-foreground/75 font-mono tracking-wider">INITIATING MAP ENGINE...</span>
      </div>
    ),
  }
);

/* ─── Simulated Outreach Deals (Matching login/signup) ────────────────────── */
const chatDeals = [
  {
    id: "saas",
    industry: "Technology / SaaS",
    flag: "🇮🇳",
    client: "Arjun Mehta",
    role: "CTO",
    company: "NovaTech Systems",
    avatar: "AM",
    avatarColor: "bg-indigo-500",
    messages: [
      { from: "client", text: "We reviewed your outreach and the product demo was exactly what we needed.", time: "14:28" },
      { from: "rep", text: "Glad to hear it! Our global team is ready to onboard you immediately.", time: "14:29" },
      { from: "client", text: "Let's move forward. We're ready to sign the annual agreement.", time: "14:32" },
      { from: "rep", text: "Fantastic! I'll send the contract today. Welcome aboard, Arjun! 🎉", time: "14:33" },
    ],
    dealLabel: "SaaS License — $48,000 / yr",
  },
  {
    id: "realestate",
    industry: "Real Estate & Construction",
    flag: "🇸🇪",
    client: "Sofia Andersson",
    role: "Property Director",
    company: "Nordic Developments",
    avatar: "SA",
    avatarColor: "bg-emerald-500",
    messages: [
      { from: "client", text: "Your portfolio covers exactly what we need for the Stockholm expansion.", time: "10:14" },
      { from: "rep", text: "Perfect. Our partnership model is flexible — we can start with Phase 1.", time: "10:16" },
      { from: "client", text: "Agreed. We're ready to sign. Prepare the partnership agreement.", time: "10:19" },
      { from: "rep", text: "Excellent! Legal team will send docs within 24 hours. Exciting times ahead!", time: "10:21" },
    ],
    dealLabel: "Property Partnership — €2.1M",
  },
  {
    id: "manufacturing",
    industry: "Manufacturing & Supply Chain",
    flag: "🇨🇳",
    client: "Chen Wei",
    role: "Supply Director",
    company: "Horizon Manufacturing",
    avatar: "CW",
    avatarColor: "bg-orange-500",
    messages: [
      { from: "client", text: "Your pricing structure is competitive and aligns with our Q2 targets.", time: "09:05" },
      { from: "rep", text: "We also include priority logistics support and quarterly reviews.", time: "09:07" },
      { from: "client", text: "That seals it. We accept your offer and are ready to proceed.", time: "09:10" },
      { from: "rep", text: "Excellent! I'll confirm the supply agreement. First shipment: March 15. ✅", time: "09:12" },
    ],
    dealLabel: "Supply Contract — $310,000",
  },
];

function ChatDealCard({ deal, isActive }: { deal: typeof chatDeals[0]; isActive: boolean }) {
  return (
    <motion.div
      key={deal.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 30 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="absolute inset-0 rounded-2xl border border-border bg-card shadow-popover overflow-hidden flex flex-col h-full text-foreground"
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card shrink-0">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shrink-0", deal.avatarColor)}>
          {deal.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate text-foreground">{deal.client} {deal.flag}</p>
          <p className="text-xs text-muted-foreground truncate">{deal.role} · {deal.company}</p>
        </div>
        <span className="shrink-0 manifest-chip">{deal.industry}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin bg-card">
        {deal.messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isActive ? i * 0.12 : 0, duration: 0.25, ease: EASE_OUT }}
            className={cn("flex gap-2", msg.from === "rep" ? "flex-row-reverse" : "flex-row")}
          >
            {msg.from === "client" && (
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0 mt-0.5", deal.avatarColor)}>
                {deal.avatar}
              </div>
            )}
            <div className="max-w-[75%]">
              <div className={msg.from === "rep" ? "chat-bubble-out text-white" : "chat-bubble-in text-foreground"}>
                {msg.text}
              </div>
              <p className={cn("mt-0.5 text-[10px] text-muted-foreground", msg.from === "rep" ? "text-right" : "text-left")}>
                {msg.time}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="border-t border-border bg-success/5 px-4 py-3 flex items-center justify-between mt-auto shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ delay: isActive ? 0.6 : 0, duration: 0.3 }}
      >
        <span className="deal-badge font-medium">✓ Deal Agreed</span>
        <span className="text-sm font-semibold text-success">{deal.dealLabel}</span>
      </motion.div>
    </motion.div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OnboardContent />
    </Suspense>
  );
}

function OnboardContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const prefersReduced = useReducedMotion();

  const fullNameId = useId();
  const passwordId = useId();

  const [verificationState, setVerificationState] = useState<"verifying" | "valid" | "invalid">("verifying");
  const [inviteDetails, setInviteDetails] = useState<VerifyInvitationResponse | null>(null);
  
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeDeal, setActiveDeal] = useState(0);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  // Rotate deal cards on the right side
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDeal((prev) => (prev + 1) % chatDeals.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Verify the invitation token on mount
  useEffect(() => {
    if (!token) {
      setVerificationState("invalid");
      setErrorMsg("Invitation token is missing. Please check your invitation URL.");
      return;
    }

    verifyInviteToken(token)
      .then((details) => {
        setInviteDetails(details);
        setFullName(details.full_name || "");
        setVerificationState("valid");
      })
      .catch((err) => {
        setVerificationState("invalid");
        if (err instanceof ApiError) {
          setErrorMsg(err.detail || "This invitation link is invalid or has expired.");
        } else {
          setErrorMsg("Failed to verify invitation. Please check your connection.");
        }
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!fullName.trim() || password.length < 8) {
      setErrorMsg("Please enter your name and a password of at least 8 characters.");
      setSubmitState("error");
      setShake(true);
      return;
    }

    setSubmitState("loading");
    try {
      await acceptInvite({
        token,
        password,
        full_name: fullName.trim(),
      });
      setSubmitState("success");
      toast.success("Welcome! Registration completed successfully.");
      
      // Force page reload to dashboard to ensure complete authentication rehydration
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1400);
    } catch (err) {
      let msg = "Onboarding failed. Please try again.";
      if (err instanceof ApiError) {
        msg = err.detail || "Failed to accept invitation.";
      }
      setErrorMsg(msg);
      setSubmitState("error");
      setShake(true);
      toast.error(msg);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left side: Form */}
      <main className="col-span-1 flex flex-col justify-between p-6 sm:p-10 lg:col-span-5 bg-card border-r border-border relative overflow-y-auto min-h-screen">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <header className="relative flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_hsl(228,100%,64%,0.4)]"
              whileHover={{ scale: 1.08, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Globe2 className="h-4.5 w-4.5" />
            </motion.div>
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Global<span className="gradient-text font-bold">Reach</span>
            </span>
          </div>
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Log in instead
          </Link>
        </header>

        <div className="my-auto py-12 max-w-sm w-full mx-auto relative z-10 shrink-0">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <AnimatePresence mode="wait">
              {verificationState === "verifying" ? (
                /* Verifying token state */
                <motion.div
                  key="verifying"
                  className="flex flex-col items-center gap-3 py-12 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Verifying invitation details…</p>
                </motion.div>
              ) : verificationState === "invalid" ? (
                /* Invalid invite link */
                <motion.div
                  key="invalid"
                  className="flex flex-col items-center gap-4 py-8 text-center"
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger mb-2">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground">Invitation Invalid</h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
                      {errorMsg || "This invitation link is invalid, expired, or has already been accepted."}
                    </p>
                  </div>
                  <Button asChild className="mt-4 shadow-sm" variant="outline">
                    <Link href="/login">Go to Login</Link>
                  </Button>
                </motion.div>
              ) : submitState === "success" ? (
                /* Acceptance success state */
                <motion.div
                  key="success"
                  className="flex flex-col items-center gap-4 py-8 text-center"
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...springUI, delay: 0.05 }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10"
                  >
                    <CheckCircle2 className="h-7 w-7 text-success" />
                  </motion.div>
                  <div>
                    <p className="font-display text-lg font-semibold text-foreground">Account created!</p>
                    <p className="mt-1 text-sm text-muted-foreground">Setting up your teammate workspace…</p>
                  </div>
                  <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.3, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              ) : (
                /* Valid invitation form */
                <motion.div
                  key="form"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                >
                  <motion.div variants={staggerChild}>
                    <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Join your team</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      You've been invited to join <span className="font-semibold text-foreground">{inviteDetails?.org_name}</span> as a <span className="font-mono text-foreground capitalize">{inviteDetails?.role}</span>.
                    </p>
                  </motion.div>

                  <motion.form
                    className="mt-6 space-y-4"
                    onSubmit={handleSubmit}
                    animate={
                      shake && !prefersReduced
                        ? { x: [0, -7, 7, -5, 5, -3, 3, 0] }
                        : { x: 0 }
                    }
                    onAnimationComplete={() => setShake(false)}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <motion.div variants={staggerChild}>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Work email
                      </label>
                      <Input
                        value={inviteDetails?.email || ""}
                        readOnly
                        disabled
                        className="bg-muted/40 cursor-not-allowed border-border/80 text-muted-foreground"
                      />
                    </motion.div>

                    <motion.div variants={staggerChild}>
                      <label
                        className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-colors focus-within:text-primary"
                        htmlFor={fullNameId}
                      >
                        Full Name
                      </label>
                      <Input
                        id={fullNameId}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        disabled={submitState === "loading"}
                        className={submitState === "error" ? "border-danger/60 focus-visible:ring-danger/30" : ""}
                      />
                    </motion.div>

                    <motion.div variants={staggerChild}>
                      <label
                        className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-colors focus-within:text-primary"
                        htmlFor={passwordId}
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          id={passwordId}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password (8+ chars)"
                          disabled={submitState === "loading"}
                          className={cn(
                            "pr-10",
                            submitState === "error" ? "border-danger/60 focus-visible:ring-danger/30" : ""
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                          disabled={submitState === "loading"}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </motion.div>

                    <AnimatePresence>
                      {submitState === "error" && (
                        <motion.p
                          key="error-msg"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-xs font-medium text-danger"
                        >
                          {errorMsg}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <motion.div variants={staggerChild} className="pt-2">
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Button
                          type="submit"
                          className="w-full shadow-md shadow-primary/20"
                          size="lg"
                          disabled={submitState === "loading"}
                        >
                          {submitState === "loading" ? "Completing setup…" : "Complete Setup"}
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <footer className="relative mt-auto pt-6 border-t border-border/60 flex flex-wrap justify-between items-center gap-4 z-10 shrink-0 text-[11px] text-muted-foreground">
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-success/80" />
              SOC 2 Type II
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-success/80" />
              GDPR Compliant
            </span>
          </div>
          <div>
            © {new Date().getFullYear()} GlobalReach
          </div>
        </footer>
      </main>

      {/* Right side: Interactive Showcase */}
      <section className="hidden lg:col-span-7 lg:flex flex-col justify-between bg-[hsl(224,33%,6%)] p-12 relative overflow-hidden text-white border-l border-border/20 min-h-screen">
        <div className="hero-orb w-[600px] h-[600px] bg-primary/15 -top-40 -right-40" />
        <div className="hero-orb w-[450px] h-[450px] bg-accent/10 bottom-0 left-20" />

        <div className="relative z-10 flex items-center justify-between shrink-0">
          <span className="manifest-chip border-border/20 bg-muted/10 text-slate-300">
            🌍 &nbsp;190+ MARKETS · ACTIVE OUTREACH PIPELINE
          </span>
          <span className="font-mono text-xs text-slate-400">
            SYS_STATUS: ONLINE
          </span>
        </div>

        <div className="my-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-center relative z-10 py-8 w-full max-w-5xl mx-auto shrink-0">
          {/* Map Grid */}
          <div className="xl:col-span-6 rounded-2xl border border-border/10 bg-slate-900/30 p-4 backdrop-blur-md shadow-2xl relative overflow-hidden h-[340px] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 border-b border-border/10 pb-3 shrink-0">
              <span className="h-2 w-2 rounded-full bg-danger/70 animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-accent/70" />
              <span className="h-2 w-2 rounded-full bg-success/70" />
              <span className="ml-2 font-mono text-[10px] text-slate-400">globalreach — 12 leads plotted</span>
            </div>

            <div className="mt-3 flex-1 bg-slate-950/40 rounded-xl overflow-hidden relative z-0">
              <InteractiveMap leads={mockLeads} />
            </div>
          </div>

          {/* Rotating Chat Deal Cards */}
          <div className="xl:col-span-6 h-[340px] relative w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {chatDeals.map((deal, idx) => (
                idx === activeDeal && (
                  <ChatDealCard key={deal.id} deal={deal} isActive={true} />
                )
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative z-10 mt-auto pt-6 flex justify-between items-end border-t border-border/10 shrink-0">
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight text-white">
              Watch your pipeline <span className="gradient-text font-bold">grow in real time</span>.
            </h3>
            <p className="mt-1.5 text-xs text-slate-400 max-w-sm">
              Discover and target hot leads, engage via automated touchpoints, and close high-value deals effortlessly.
            </p>
          </div>
          <div className="flex gap-6 font-mono text-xs text-slate-400">
            <div>
              <p className="text-white font-bold text-sm">4.2M+</p>
              <p className="text-[10px] tracking-wider text-slate-500 uppercase">leads</p>
            </div>
            <div>
              <p className="text-white font-bold text-sm">23.8%</p>
              <p className="text-[10px] tracking-wider text-slate-500 uppercase">resp. rate</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
