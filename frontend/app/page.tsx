"use client";

import Link from "next/link";

import {
  Globe2, ArrowRight, MapPin, KanbanSquare, PhoneCall, Check,
  Target, Search, MessageCircle, Handshake, Star, Building2,
  Factory, HeartPulse, Landmark, ShoppingBag, Cpu, ChevronRight,
  Shield, Zap, TrendingUp, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  fadeUp,
  staggerContainer,
  staggerContainerSlow,
  EASE_OUT,
} from "@/lib/motion";
import { useCountUp } from "@/lib/hooks/use-count-up";

/* ─── Data ────────────────────────────────────────────────────────────────── */

const stats = [
  { raw: 190, suffix: "+", label: "Countries indexed" },
  { raw: 4.2, suffix: "M", label: "Businesses in reach" },
  { raw: 23.8, suffix: "%", label: "Avg. response rate" },
  { raw: 2.1, suffix: "B", label: "Deals closed ($)" },
];

const processSteps = [
  {
    icon: Target,
    step: "01",
    title: "Target",
    body: "Define your ideal client profile. Filter by industry, country, company size, revenue range, and radius.",
    color: "hsl(228,100%,64%)",
    bg: "bg-primary/10",
    text: "text-primary",
  },
  {
    icon: Search,
    step: "02",
    title: "Discover",
    body: "AI-ranked leads appear instantly on an interactive global map. Every pin is a real, verified business.",
    color: "hsl(37,90%,60%)",
    bg: "bg-accent/10",
    text: "text-accent",
  },
  {
    icon: MessageCircle,
    step: "03",
    title: "Reach Out",
    body: "Send personalised messages or make calls directly from the lead record. Every touch is logged automatically.",
    color: "hsl(160,62%,42%)",
    bg: "bg-success/10",
    text: "text-success",
  },
  {
    icon: Handshake,
    step: "04",
    title: "Close",
    body: "Move deals through your visual pipeline — Contacted → Responded → Negotiating → Won — and celebrate every close.",
    color: "hsl(228,100%,64%)",
    bg: "bg-primary/10",
    text: "text-primary",
  },
];

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

const industries = [
  {
    icon: Cpu,
    name: "Technology & SaaS",
    tagline: "Close global software deals faster",
    body: "Find CTOs, VPs of Engineering, and digital decision-makers across 190+ countries using verified company data.",
    metric: "31% avg. response rate",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Building2,
    name: "Real Estate & Construction",
    tagline: "Expand across borders with confidence",
    body: "Identify property developers, architects, and construction firms by region and project type.",
    metric: "28% avg. response rate",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Factory,
    name: "Manufacturing & Supply Chain",
    tagline: "Source partners across every continent",
    body: "Discover manufacturers, distributors, and logistics partners filtered by capacity and export capability.",
    metric: "24% avg. response rate",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: HeartPulse,
    name: "Healthcare & Life Sciences",
    tagline: "Reach clinics, labs, and distributors globally",
    body: "Connect with healthcare providers, medical device buyers, and pharma distributors with precise market filters.",
    metric: "19% avg. response rate",
    color: "text-danger",
    bg: "bg-danger/10",
  },
  {
    icon: Landmark,
    name: "Finance & Fintech",
    tagline: "Build partnerships in regulated markets",
    body: "Find banks, investment firms, payment processors, and fintech startups across key financial hubs.",
    metric: "22% avg. response rate",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: ShoppingBag,
    name: "Retail & E-Commerce",
    tagline: "Scale your brand into new markets",
    body: "Connect with retail chains, distributors, and e-commerce operators ready to expand their product lines.",
    metric: "26% avg. response rate",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

const testimonials = [
  {
    quote: "GlobalReach helped us book 18 qualified meetings in our first month targeting the DACH region. The map view is genuinely game-changing.",
    author: "Priya Nair",
    role: "Head of Sales, CloudAxis",
    flag: "🇩🇪",
    avatar: "PN",
    color: "bg-violet-500",
  },
  {
    quote: "We closed three enterprise contracts in Southeast Asia within 60 days. The pipeline board keeps our whole team aligned and accountable.",
    author: "Marco Ferretti",
    role: "VP Growth, Stratos B2B",
    flag: "🇸🇬",
    avatar: "MF",
    color: "bg-rose-500",
  },
  {
    quote: "Outreach used to take us weeks to organise. With GlobalReach, our reps hit new markets in a single afternoon — and the response rates prove it.",
    author: "Amara Osei",
    role: "Business Dev Director, LinkForge",
    flag: "🇳🇬",
    avatar: "AO",
    color: "bg-emerald-600",
  },
];

const tiers = [
  {
    name: "Starter",
    price: "$49",
    period: "/rep/mo",
    features: ["500 lead searches/mo", "1 pipeline board", "Email + chat outreach", "Basic analytics"],
  },
  {
    name: "Growth",
    price: "$129",
    period: "/rep/mo",
    features: ["Unlimited searches", "Unlimited boards", "Voice calling", "Team analytics", "Priority support"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["SSO & role controls", "Dedicated onboarding", "API & data exports", "Custom integrations"],
  },
];

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function StatCounter({ raw, suffix, label }: { raw: number; suffix: string; label: string }) {
  const isDecimal = !Number.isInteger(raw);
  const endInt = isDecimal ? Math.round(raw * 10) : raw;
  const { value, ref } = useCountUp<HTMLSpanElement>(endInt, 1200);
  const display = isDecimal ? (value / 10).toFixed(1) : value.toLocaleString();
  return (
    <div className="text-center">
      <p className="font-display text-3xl font-bold">
        <span ref={ref}>{display}</span>
        {suffix}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ChatDealCard({ deal, isActive }: { deal: typeof chatDeals[0]; isActive: boolean }) {
  return (
    <motion.div
      key={deal.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 30 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="absolute inset-0 rounded-2xl border border-border bg-card shadow-popover overflow-hidden flex flex-col"
    >
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shrink-0", deal.avatarColor)}>
          {deal.avatar}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{deal.client} {deal.flag}</p>
          <p className="text-xs text-muted-foreground truncate">{deal.role} · {deal.company}</p>
        </div>
        <span className="ml-auto shrink-0 manifest-chip">{deal.industry}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
              <div className={msg.from === "rep" ? "chat-bubble-out" : "chat-bubble-in"}>
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
        className="border-t border-border bg-success/5 px-4 py-3 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ delay: isActive ? 0.6 : 0, duration: 0.3 }}
      >
        <span className="deal-badge">✓ Deal Agreed</span>
        <span className="text-sm font-semibold text-success">{deal.dealLabel}</span>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [activeDeal, setActiveDeal] = useState(0);
  const dealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return scrollY.on("change", (v) => setScrolled(v > 16));
  }, [scrollY]);

  // Auto-rotate deal cards
  useEffect(() => {
    dealIntervalRef.current = setInterval(() => {
      setActiveDeal((prev) => (prev + 1) % chatDeals.length);
    }, 5000);
    return () => {
      if (dealIntervalRef.current) clearInterval(dealIntervalRef.current);
    };
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const pinY = useTransform(heroProgress, [0, 1], ["0%", "18%"]);

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">

      {/* ══════════════════ STICKY HEADER ══════════════════ */}
      <motion.header
        className={cn(
          "sticky top-0 z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-4 transition-all duration-300",
          scrolled && "rounded-b-xl backdrop-blur-md bg-background/85 shadow-card border-b border-border"
        )}
        initial={false}
      >
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-ring">
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_hsl(228,100%,64%,0.4)]"
            whileHover={{ scale: 1.08, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Globe2 className="h-4.5 w-4.5" />
          </motion.div>
          <span className="font-display text-lg font-bold tracking-tight">
            Global<span className="gradient-text">Reach</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {[
            { label: "Product", href: "#product" },
            { label: "How It Works", href: "#how-it-works" },
            { label: "Industries", href: "#industries" },
            { label: "Pricing", href: "#pricing" },
          ].map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              className="hover:text-foreground transition-colors duration-150 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-200 hover:after:w-full"
              whileHover={{ y: -1 }}
              transition={{ duration: 0.15 }}
            >
              {item.label}
            </motion.a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-medium hover:bg-muted/80">
              Log in
            </Button>
          </Link>
          <Link href="/login">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="sm" className="shadow-[0_0_16px_hsl(228,100%,64%,0.35)] hover:shadow-[0_0_24px_hsl(228,100%,64%,0.5)] transition-shadow">
                Start free trial
              </Button>
            </motion.div>
          </Link>
        </div>
      </motion.header>

      {/* ══════════════════ HERO ══════════════════ */}
      <section ref={heroRef} className="relative overflow-hidden border-b border-border">
        {/* Ambient glow orbs */}
        <div className="hero-orb w-[600px] h-[600px] bg-primary/20 -top-40 -left-40 dark:bg-primary/10" />
        <div className="hero-orb w-[400px] h-[400px] bg-accent/15 top-20 right-0 dark:bg-accent/8" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">

          {/* Left: copy + CTA */}
          <motion.div
            variants={staggerContainerSlow}
            initial="hidden"
            animate="visible"
          >
            <motion.span variants={fadeUp} className="manifest-chip">
              🌍 &nbsp;190+ MARKETS · GLOBAL OUTREACH CRM
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl"
            >
              Turn cold markets into{" "}
              <span className="gradient-text">warm clients</span>
              {" "}— anywhere on Earth.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground"
            >
              GlobalReach is the discovery and outreach CRM built for teams selling across borders.
              Pinpoint leads by industry, country, and revenue — then message, call, and close them
              from one unified workspace.
            </motion.p>

            {/* Trust badges */}
            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
              {[
                { icon: Shield, label: "SOC 2 Type II" },
                { icon: Shield, label: "GDPR Compliant" },
                { icon: Zap, label: "No setup required" },
                { icon: TrendingUp, label: "14-day free trial" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="trust-badge">
                  <Icon className="h-3 w-3 text-success" />
                  {label}
                </span>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="shadow-[0_0_20px_hsl(228,100%,64%,0.4)] hover:shadow-[0_0_32px_hsl(228,100%,64%,0.55)] transition-shadow">
                    Start free trial <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button size="lg" variant="outline" className="border-border/80">
                    View live demo
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: map visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.2, ease: EASE_OUT }}
          >
            <div className="rounded-2xl border border-border bg-card p-4 shadow-popover">
              <div className="flex items-center gap-1.5 border-b border-border pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-2 font-mono text-[11px] text-muted-foreground">globalreach — 12 leads plotted</span>
              </div>
              <div className="mt-3 h-80 rounded-xl bg-[hsl(224,33%,7%)] p-4 overflow-hidden relative">
                <svg viewBox="0 0 440 270" className="h-full w-full">
                  <defs>
                    <pattern id="hero-grid" width="22" height="22" patternUnits="userSpaceOnUse">
                      <path d="M22 0 L0 0 0 22" fill="none" stroke="hsl(220,20%,18%)" strokeWidth="0.5" />
                    </pattern>
                    <radialGradient id="glow-blue" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="hsl(228,100%,64%)" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="hsl(228,100%,64%)" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="glow-amber" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="hsl(37,90%,60%)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="hsl(37,90%,60%)" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="440" height="270" fill="url(#hero-grid)" />

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

                  {/* Pins */}
                  <motion.g style={{ y: prefersReduced ? 0 : pinY }}>
                    {[
                      { x: 85, y: 95, size: 5, color: "hsl(228,100%,64%)", ring: false },
                      { x: 165, y: 145, size: 5, color: "hsl(228,100%,64%)", ring: false },
                      { x: 270, y: 90, size: 9, color: "hsl(37,90%,60%)", ring: true },
                      { x: 330, y: 155, size: 5, color: "hsl(228,100%,64%)", ring: false },
                      { x: 340, y: 60, size: 5, color: "hsl(160,62%,42%)", ring: false },
                      { x: 120, y: 175, size: 5, color: "hsl(228,100%,64%)", ring: false },
                      { x: 220, y: 200, size: 5, color: "hsl(37,90%,60%)", ring: false },
                      { x: 390, y: 120, size: 5, color: "hsl(160,62%,42%)", ring: false },
                    ].map(({ x, y, size, color, ring }, i) => (
                      <motion.g
                        key={i}
                        transform={`translate(${x} ${y})`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 280, damping: 20 }}
                        whileHover={{ scale: 1.5 }}
                      >
                        {ring && (
                          <>
                            <motion.circle r={size + 8} fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.2"
                              animate={{ r: [size + 8, size + 16], opacity: [0.3, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                            />
                            <circle r={size + 4} fill={`url(#glow-amber)`} opacity="0.6" />
                          </>
                        )}
                        <circle r={size} fill={color} stroke="white" strokeWidth="1.5" />
                      </motion.g>
                    ))}
                  </motion.g>
                </svg>

                {/* Overlay lead card */}
                <motion.div
                  className="absolute bottom-3 left-3 right-3 rounded-lg border border-border/60 bg-card/90 backdrop-blur-sm px-3 py-2.5 flex items-center gap-2.5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.3, ease: EASE_OUT }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">NovaTech Systems · 🇮🇳 Mumbai</p>
                    <p className="text-[10px] text-muted-foreground">SaaS · 250-500 employees · $12M ARR</p>
                  </div>
                  <span className="shrink-0 deal-badge text-[10px]">Hot lead</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          className="border-t border-border bg-muted/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4, ease: EASE_OUT }}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-around gap-4 px-6 py-6">
            {stats.map((s) => (
              <StatCounter key={s.label} {...s} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════ HOW IT WORKS — PROCESS ══════════════════ */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="manifest-chip">HOW IT WORKS</span>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
            Your global outreach,{" "}
            <span className="gradient-text">four steps</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto">
            From cold market to signed contract — GlobalReach guides your team through every stage
            of the international client acquisition journey.
          </p>
        </motion.div>

        {/* Step cards */}
        <motion.div
          className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {processSteps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              className="relative rounded-xl border border-border bg-card p-6 hover:shadow-card transition-shadow cursor-default group"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              {/* Step number */}
              <span className="font-mono text-[11px] font-semibold text-muted-foreground">{step.step}</span>

              {/* Icon */}
              <div className={cn("mt-3 flex h-12 w-12 items-center justify-center rounded-xl", step.bg)}>
                <step.icon className={cn("h-6 w-6", step.color)} />
              </div>

              <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

              {/* Connector arrow (hidden on last) */}
              {i < processSteps.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* CTA under process */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          viewport={{ once: true }}
        >
          <Link href="/login">
            <motion.div className="inline-block" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" className="shadow-[0_0_20px_hsl(228,100%,64%,0.35)] hover:shadow-[0_0_32px_hsl(228,100%,64%,0.5)] transition-shadow">
                Start your outreach today <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* ══════════════════ CLIENT DEAL CHAT SCREENS ══════════════════ */}
      <section id="product" className="border-t border-b border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">

            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              viewport={{ once: true }}
            >
              <span className="manifest-chip">REAL DEALS, REAL CONVERSATIONS</span>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
                Watch deals close{" "}
                <span className="gradient-text">across every industry</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-md">
                GlobalReach users are having real conversations with decision-makers around the world
                — and closing deals from their desk. Here's what it looks like in practice.
              </p>

              {/* Industry selector tabs */}
              <div className="mt-8 flex flex-col gap-2">
                {chatDeals.map((deal, i) => (
                  <button
                    key={deal.id}
                    onClick={() => {
                      setActiveDeal(i);
                      if (dealIntervalRef.current) clearInterval(dealIntervalRef.current);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-200",
                      activeDeal === i
                        ? "border-primary/50 bg-primary/5 shadow-[0_0_0_1px_hsl(228,100%,64%,0.15)]"
                        : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
                    )}
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0", deal.avatarColor)}>
                      {deal.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{deal.client} <span className="text-base">{deal.flag}</span></p>
                      <p className="text-xs text-muted-foreground">{deal.industry}</p>
                    </div>
                    <span className={cn(
                      "ml-auto shrink-0 deal-badge text-[10px] transition-opacity duration-200",
                      activeDeal === i ? "opacity-100" : "opacity-0"
                    )}>
                      ✓ Closed
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Right: animated chat card */}
            <motion.div
              className="relative h-[460px] lg:h-[500px]"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT }}
              viewport={{ once: true }}
            >
              <AnimatePresence mode="wait">
                {chatDeals.map((deal, i) =>
                  activeDeal === i ? (
                    <ChatDealCard key={deal.id} deal={deal} isActive={true} />
                  ) : null
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════ INDUSTRY USE CASES ══════════════════ */}
      <section id="industries" className="mx-auto max-w-7xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="manifest-chip">USE CASES BY INDUSTRY</span>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
            Built for every{" "}
            <span className="gradient-text">global market</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-lg mx-auto">
            Whether you're selling software to CTOs or sourcing suppliers for a supply chain —
            GlobalReach has the data and tools for your sector.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {industries.map((ind) => (
            <motion.div key={ind.name} variants={fadeUp} className="industry-card group">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", ind.bg)}>
                <ind.icon className={cn("h-6 w-6", ind.color)} />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{ind.name}</h3>
              <p className={cn("mt-0.5 text-sm font-medium", ind.color)}>{ind.tagline}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ind.body}</p>

              <div className="mt-4 flex items-center justify-between">
                <span className="manifest-chip">{ind.metric}</span>
                <Link href="/login">
                  <motion.button
                    className={cn(
                      "flex items-center gap-1 text-xs font-semibold transition-colors duration-150 opacity-0 group-hover:opacity-100",
                      ind.color
                    )}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.15 }}
                  >
                    Get started <ArrowRight className="h-3 w-3" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* View all CTA */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          viewport={{ once: true }}
        >
          <Link href="/login">
            <Button variant="outline" size="lg" className="group">
              Explore all industries
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ══════════════════ PILLARS / PRODUCT FEATURES ══════════════════ */}
      <section className="border-t border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            viewport={{ once: true }}
          >
            <span className="manifest-chip">THE PLATFORM</span>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
              One dashboard,{" "}
              <span className="gradient-text">start to close.</span>
            </h2>
          </motion.div>

          <motion.div
            className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {[
              { icon: MapPin, title: "Discover", body: "Filter by industry, country, company size, and radius — then work results as a list or a live interactive map.", color: "text-primary", bg: "bg-primary/10" },
              { icon: KanbanSquare, title: "Pipeline", body: "Drag leads through a visual board built for outreach: New → Contacted → Responded → Negotiating → Won.", color: "text-accent", bg: "bg-accent/10" },
              { icon: PhoneCall, title: "Reach Out", body: "Message and call from the same lead record, with every touchpoint logged to the client's complete timeline.", color: "text-success", bg: "bg-success/10" },
            ].map((p) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                className="group rounded-xl border border-border bg-card p-7 shadow-subtle transition-shadow hover:shadow-card cursor-default"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
              >
                <motion.div
                  className={cn("flex h-12 w-12 items-center justify-center rounded-xl", p.bg)}
                  whileHover={{ scale: 1.1, rotate: -6 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <p.icon className={cn("h-6 w-6", p.color)} />
                </motion.div>
                <h3 className="mt-5 font-display text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          viewport={{ once: true }}
        >
          <span className="manifest-chip">WHAT OUR CUSTOMERS SAY</span>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
            Trusted by sales teams{" "}
            <span className="gradient-text">worldwide</span>
          </h2>
        </motion.div>

        <motion.div
          className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.author}
              variants={fadeUp}
              className="rounded-xl border border-border bg-card p-6 shadow-subtle hover:shadow-card transition-shadow"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shrink-0", t.color)}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.author} <span className="text-base">{t.flag}</span></p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════ PRICING ══════════════════ */}
      <section id="pricing" className="border-t border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            viewport={{ once: true }}
          >
            <span className="manifest-chip">PRICING</span>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
              Priced per rep,{" "}
              <span className="gradient-text">not per lead.</span>
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-md mx-auto">
              Start with a 14-day free trial. No credit card required. Cancel anytime.
            </p>
          </motion.div>

          <motion.div
            className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {tiers.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                whileHover={t.featured ? { y: -6, scale: 1.01 } : { y: -3 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className={cn(
                  "rounded-xl border p-7 transition-shadow",
                  t.featured
                    ? "border-primary bg-card shadow-[0_0_0_1px_hsl(228,100%,64%,0.25),0_0_40px_-8px_hsl(228,100%,64%,0.3)]"
                    : "border-border bg-card shadow-subtle hover:shadow-card"
                )}
              >
                {t.featured && (
                  <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                    Most popular
                  </span>
                )}
                <p className="text-sm font-bold">{t.name}</p>
                <p className="mt-2 font-display text-4xl font-bold">
                  {t.price}
                  <span className="text-sm font-normal text-muted-foreground">{t.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <motion.div className="mt-7" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full" variant={t.featured ? "default" : "outline"}>
                      {t.name === "Enterprise" ? "Talk to sales" : "Start free trial"}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ FINAL CTA BANNER ══════════════════ */}
      <section className="px-6 py-6">
        <motion.div
          className="mx-auto max-w-7xl overflow-hidden rounded-2xl cta-banner px-8 py-16 text-center relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          viewport={{ once: true }}
        >
          {/* Orbs inside banner */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          </div>

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Globe2 className="h-3 w-3" /> Global Client Discovery Platform
            </span>
            <h2 className="mt-5 font-display text-4xl font-bold text-white md:text-5xl">
              Your next client is already on the map.
            </h2>
            <p className="mt-4 text-base text-white/80 max-w-md mx-auto">
              Join thousands of sales teams discovering and closing clients across 190+ countries.
              Start free — no credit card needed.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" variant="secondary" className="font-semibold shadow-lg">
                    Get started free <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" variant="ghost" className="text-white border border-white/30 hover:bg-white/10">
                    View live demo
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Social proof mini strip */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-white/70 text-xs">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> 12,000+ active reps</span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-current" /> 4.9 / 5 on G2</span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> SOC 2 certified</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Globe2 className="h-4 w-4" />
                </div>
                <span className="font-display font-bold">Global<span className="gradient-text">Reach</span></span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground max-w-[200px]">
                The global outreach CRM for ambitious sales teams.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 text-sm">
              <div>
                <p className="font-semibold mb-3">Product</p>
                <ul className="space-y-2 text-muted-foreground">
                  {["Features", "Pricing", "Changelog", "Roadmap"].map((l) => (
                    <li key={l}><a href="#" className="hover:text-foreground transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-3">Company</p>
                <ul className="space-y-2 text-muted-foreground">
                  {["About", "Blog", "Careers", "Contact"].map((l) => (
                    <li key={l}><a href="#" className="hover:text-foreground transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-3">Legal</p>
                <ul className="space-y-2 text-muted-foreground">
                  {["Privacy", "Terms", "Security", "GDPR"].map((l) => (
                    <li key={l}><a href="#" className="hover:text-foreground transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <span>© 2026 GlobalReach, Inc. All rights reserved.</span>
            <span className="manifest-chip">BUILT FOR 190+ MARKETS</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
