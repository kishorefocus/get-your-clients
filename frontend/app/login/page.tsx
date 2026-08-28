"use client";

import Link from "next/link";
import {
  Globe2, CheckCircle2, Shield, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useId, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { scaleIn, staggerContainer, staggerChild, springUI, EASE_OUT } from "@/lib/motion";
import { useAuth } from "@/lib/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── Simulated Outreach Deals ────────────────────────────────────────────── */
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
      {/* Chat header */}
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

      {/* Messages */}
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

      {/* Deal agreed badge */}
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

export default function LoginPage() {
  const prefersReduced = useReducedMotion();
  const router = useRouter();
  const { login } = useAuth();
  const emailId = useId();
  const passwordId = useId();

  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("Invalid email or password. Please try again.");
  const [shakeKey, setShakeKey] = useState(0);
  const [activeDeal, setActiveDeal] = useState(0);

  // Auto-rotate deal cards
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDeal((prev) => (prev + 1) % chatDeals.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const pw = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (!email || !pw || pw.length < 4) {
      setErrorMsg("Please enter your email and password.");
      setState("error");
      setShakeKey((k) => k + 1);
      return;
    }

    setState("loading");
    try {
      await login({ email, password: pw });
      setState("success");
      setTimeout(() => router.push("/dashboard/discovery"), 1400);
    } catch (err) {
      let msg = "Invalid email or password. Please try again.";
      if (err instanceof ApiError) {
        if (err.status === 401) msg = "Invalid email or password.";
        else if (err.status >= 500) msg = "Server error — please try again shortly.";
        else msg = err.detail;
      }
      setErrorMsg(msg);
      setState("error");
      setShakeKey((k) => k + 1);
      toast.error(msg);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left side: Login Form */}
      <main className="col-span-1 flex flex-col justify-between p-6 sm:p-10 lg:col-span-5 bg-card border-r border-border relative overflow-y-auto min-h-screen">
        {/* Ambient glow orb */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
        </div>

        {/* Top Header */}
        <header className="relative flex items-center justify-between z-10 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
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
          </Link>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Back to Home
          </Link>
        </header>

        {/* Center content: Login Card */}
        <div className="my-auto py-12 max-w-sm w-full mx-auto relative z-10 shrink-0">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <AnimatePresence mode="wait">
              {state === "success" ? (
                /* Success state */
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
                    <p className="font-display text-lg font-semibold text-foreground">Welcome back!</p>
                    <p className="mt-1 text-sm text-muted-foreground">Taking you to your dashboard…</p>
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
                /* Form state */
                <motion.div
                  key="form"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                >
                  <motion.div variants={staggerChild}>
                    <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Log in</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Welcome back — pick up where your team left off.
                    </p>
                  </motion.div>

                  <motion.form
                    key={shakeKey}
                    className="mt-6 space-y-4"
                    onSubmit={handleSubmit}
                    animate={
                      state === "error" && !prefersReduced
                        ? { x: [0, -7, 7, -5, 5, -3, 3, 0] }
                        : { x: 0 }
                    }
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <motion.div variants={staggerChild}>
                      <label
                        className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-colors focus-within:text-primary"
                        htmlFor={emailId}
                      >
                        Work email
                      </label>
                      <Input
                        id={emailId}
                        name="email"
                        type="email"
                        placeholder="you@company.com"
                        disabled={state === "loading"}
                        className={state === "error" ? "border-danger/60 focus-visible:ring-danger/30" : ""}
                      />
                    </motion.div>

                    <motion.div variants={staggerChild}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label
                          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-colors focus-within:text-primary"
                          htmlFor={passwordId}
                        >
                          Password
                        </label>
                        <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                          Forgot?
                        </Link>
                      </div>
                      <Input
                        id={passwordId}
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        disabled={state === "loading"}
                        className={state === "error" ? "border-danger/60 focus-visible:ring-danger/30" : ""}
                      />
                    </motion.div>

                    <AnimatePresence>
                      {state === "error" && (
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
                          disabled={state === "loading"}
                        >
                          {state === "loading" ? "Logging in…" : "Log in"}
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.form>

                  <motion.p
                    variants={staggerChild}
                    className="mt-6 text-center text-xs text-muted-foreground"
                  >
                    New to GlobalReach?{" "}
                    <Link href="/signup" className="text-primary hover:underline font-semibold">
                      Create an account
                    </Link>
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer / Trust Badges */}
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
        {/* Glow Orbs */}
        <div className="hero-orb w-[600px] h-[600px] bg-primary/15 -top-40 -right-40" />
        <div className="hero-orb w-[450px] h-[450px] bg-accent/10 bottom-0 left-20" />

        {/* Top coordinate stats badge */}
        <div className="relative z-10 flex items-center justify-between shrink-0">
          <span className="manifest-chip border-border/20 bg-muted/10 text-slate-300">
            🌍 &nbsp;190+ MARKETS · ACTIVE OUTREACH PIPELINE
          </span>
          <span className="font-mono text-xs text-slate-400">
            SYS_STATUS: ONLINE
          </span>
        </div>

        {/* Center content: Map + Chat deals */}
        <div className="my-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-center relative z-10 py-8 w-full max-w-5xl mx-auto shrink-0">
          {/* Map Grid */}
          <div className="xl:col-span-6 rounded-2xl border border-border/10 bg-slate-900/30 p-4 backdrop-blur-md shadow-2xl relative overflow-hidden h-[340px] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 border-b border-border/10 pb-3 shrink-0">
              <span className="h-2 w-2 rounded-full bg-danger/70 animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-accent/70" />
              <span className="h-2 w-2 rounded-full bg-success/70" />
              <span className="ml-2 font-mono text-[10px] text-slate-400">realtime_stream — active coordinates</span>
            </div>
            
            <div className="mt-3 flex-1 bg-slate-950/40 rounded-xl overflow-hidden relative flex items-center justify-center p-2">
              <svg viewBox="0 0 440 270" className="h-full w-full opacity-90">
                <defs>
                  <pattern id="login-grid" width="22" height="22" patternUnits="userSpaceOnUse">
                    <path d="M22 0 L0 0 0 22" fill="none" stroke="hsl(220,20%,18%)" strokeWidth="0.5" />
                  </pattern>
                  <radialGradient id="login-glow-blue" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(228,100%,64%)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="hsl(228,100%,64%)" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="login-glow-amber" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(37,90%,60%)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="hsl(37,90%,60%)" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="440" height="270" fill="url(#login-grid)" />

                {/* Continent silhouettes */}
                <g opacity="0.08" fill="hsl(220,30%,60%)">
                  <path d="M30 80 Q60 60 100 70 Q140 60 170 80 Q190 95 180 120 Q160 140 130 130 Q90 140 60 120 Q30 110 30 80Z" />
                  <path d="M190 40 Q250 30 310 50 Q360 60 390 100 Q400 130 380 160 Q350 180 300 175 Q250 180 220 160 Q190 140 180 110 Q170 80 190 40Z" />
                  <path d="M200 185 Q240 175 270 190 Q290 205 280 230 Q260 250 230 245 Q200 240 195 215 Q190 200 200 185Z" />
                  <path d="M310 175 Q340 165 370 180 Q390 200 385 225 Q370 240 345 235 Q320 230 310 210 Q300 190 310 175Z" />
                </g>

                {/* Connection lines */}
                <g stroke="hsl(228,100%,64%)" strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="4 3" fill="none">
                  <line x1="270" y1="90" x2="85" y2="95" />
                  <line x1="270" y1="90" x2="165" y2="145" />
                  <line x1="270" y1="90" x2="330" y2="155" />
                  <line x1="270" y1="90" x2="340" y2="60" />
                </g>

                {/* Floating Pins */}
                <g>
                  {[
                    { x: 85, y: 95, size: 4, color: "hsl(228,100%,64%)", ring: false },
                    { x: 165, y: 145, size: 4, color: "hsl(228,100%,64%)", ring: false },
                    { x: 270, y: 90, size: 7, color: "hsl(37,90%,60%)", ring: true },
                    { x: 330, y: 155, size: 4, color: "hsl(228,100%,64%)", ring: false },
                    { x: 340, y: 60, size: 4, color: "hsl(160,62%,42%)", ring: false },
                    { x: 120, y: 175, size: 4, color: "hsl(228,100%,64%)", ring: false },
                    { x: 220, y: 200, size: 4, color: "hsl(37,90%,60%)", ring: false },
                    { x: 390, y: 120, size: 4, color: "hsl(160,62%,42%)", ring: false },
                  ].map(({ x, y, size, color, ring }, i) => (
                    <motion.g
                      key={i}
                      transform={`translate(${x} ${y})`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        y: prefersReduced ? 0 : [0, -4, 0],
                      }}
                      transition={{
                        scale: { delay: i * 0.08, type: "spring", stiffness: 280, damping: 20 },
                        opacity: { delay: i * 0.08 },
                        y: {
                          duration: 4 + (i % 3) * 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.2
                        }
                      }}
                    >
                      {ring && (
                        <>
                          <motion.circle r={size + 6} fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.2"
                            animate={{ r: [size + 6, size + 12], opacity: [0.3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                          />
                          <circle r={size + 3} fill={`url(#login-glow-amber)`} opacity="0.6" />
                        </>
                      )}
                      <circle r={size} fill={color} stroke="white" strokeWidth="1" />
                    </motion.g>
                  ))}
                </g>
              </svg>
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

        {/* Bottom tagline */}
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
