"use client";

import Link from "next/link";
import { Globe2, ArrowRight, MapPin, KanbanSquare, PhoneCall, Check } from "lucide-react";
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
  staggerChild,
  cardLiftProps,
  EASE_OUT,
} from "@/lib/motion";
import { useCountUp } from "@/lib/hooks/use-count-up";

/* ─── Data ────────────────────────────────────────────────────────────────── */

const stats = [
  { raw: 190, suffix: "+", label: "countries indexed" },
  { raw: 4.2, suffix: "M", label: "businesses in reach" },
  { raw: 23.8, suffix: "%", label: "avg. response rate" },
];

const pillars = [
  { icon: MapPin, title: "Discover", body: "Filter by industry, country, size, and radius, then work results as a list or a live map." },
  { icon: KanbanSquare, title: "Pipeline", body: "Drag leads through a board built for outreach: New, Contacted, Responded, Negotiating, Won." },
  { icon: PhoneCall, title: "Reach out", body: "Message and call from the same record, with every touch logged to the client's timeline." },
];

const tiers = [
  {
    name: "Starter",
    price: "$49",
    period: "/rep/mo",
    features: ["500 lead searches/mo", "1 pipeline board", "Email + chat outreach"],
  },
  {
    name: "Growth",
    price: "$129",
    period: "/rep/mo",
    features: ["Unlimited searches", "Unlimited boards", "Voice calling", "Team analytics"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["SSO & role controls", "Dedicated onboarding", "API & data exports"],
  },
];

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function StatCounter({ raw, suffix, label }: { raw: number; suffix: string; label: string }) {
  const isDecimal = !Number.isInteger(raw);
  const endInt = isDecimal ? Math.round(raw * 10) : raw;
  const { value, ref } = useCountUp<HTMLSpanElement>(endInt, 1200);

  const display = isDecimal
    ? (value / 10).toFixed(1)
    : value.toLocaleString();

  return (
    <div>
      <p className="font-display text-2xl font-semibold">
        <span ref={ref}>{display}</span>
        {suffix}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const prefersReduced = useReducedMotion();

  /* Sticky header scroll detection */
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    return scrollY.on("change", (v) => setScrolled(v > 16));
  }, [scrollY]);

  /* Parallax for SVG map pins */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const pinY = useTransform(heroProgress, [0, 1], ["0%", "18%"]);

  const transition = prefersReduced ? { duration: 0 } : undefined;

  return (
    <main className="min-h-screen bg-background">

      {/* ── Sticky header ── */}
      <motion.header
        className={cn(
          "sticky top-0 z-50 mx-auto flex max-w-6xl items-center justify-between px-6 py-5 transition-all duration-300",
          scrolled && "rounded-b-xl backdrop-blur-md bg-background/80 shadow-card border-b border-border"
        )}
        initial={false}
      >
        <Link href="/" className="flex items-center gap-2 focus-visible:outline-ring">
          <motion.div
            className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <Globe2 className="h-4 w-4" />
          </motion.div>
          <span className="font-display text-lg font-semibold tracking-tight">GlobalReach</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {["Product", "Pricing", "Docs"].map((item) => (
            <motion.a
              key={item}
              href={item === "Product" ? "#product" : item === "Pricing" ? "#pricing" : "#"}
              className="hover:text-foreground transition-colors duration-150"
              whileHover={{ y: -1 }}
              transition={{ duration: 0.15 }}
            >
              {item}
            </motion.a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hover:bg-muted/80">Log in</Button>
          </Link>
          <Link href="/signup">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="sm">Start free trial</Button>
            </motion.div>
          </Link>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">

          {/* Left: staggered text + CTA */}
          <motion.div
            variants={staggerContainerSlow}
            initial="hidden"
            animate="visible"
          >
            <motion.span
              variants={fadeUp}
              className="manifest-chip"
            >
              51.95N 4.14E · ROTTERDAM, NL
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl"
            >
              Find your next client, wherever they run their business.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground"
            >
              GlobalReach is the discovery and outreach CRM for teams selling across borders — search leads
              by industry and country, work them on a map, and run every message and call from one desk.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex items-center gap-3">
              <Link href="/signup">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg">
                    Start free trial <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button size="lg" variant="outline">View live demo</Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Stats row — count up on scroll into view */}
            <motion.div variants={fadeUp} className="mt-10 flex gap-8">
              {stats.map((s) => (
                <StatCounter key={s.label} {...s} />
              ))}
            </motion.div>
          </motion.div>

          {/* Right: map illustration with parallax pins */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT }}
          >
            <div className="rounded-xl border border-border bg-card p-3 shadow-popover">
              <div className="flex items-center gap-1.5 border-b border-border pb-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-2 font-mono text-[11px] text-muted-foreground">discovery — 8 pins plotted</span>
              </div>

              <div className="mt-3 h-72 rounded-lg bg-[hsl(224,33%,7%)] p-4 overflow-hidden">
                <svg viewBox="0 0 400 240" className="h-full w-full">
                  <defs>
                    <pattern id="hero-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M20 0 L0 0 0 20" fill="none" stroke="hsl(220,20%,20%)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="400" height="240" fill="url(#hero-grid)" />

                  {/* Parallax pin group */}
                  <motion.g style={{ y: prefersReduced ? 0 : pinY }}>
                    {[[80, 60], [150, 130], [260, 90], [320, 150], [200, 40], [110, 170]].map(([x, y], i) => (
                      <motion.g
                        key={i}
                        transform={`translate(${x} ${y})`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.07, type: "spring", stiffness: 300, damping: 22 }}
                        whileHover={{ scale: 1.4 }}
                      >
                        <circle
                          r={i === 2 ? 7 : 4}
                          fill={i === 2 ? "hsl(37,90%,60%)" : "hsl(228,100%,64%)"}
                          stroke="white"
                          strokeWidth="1.2"
                        />
                        {i === 2 && (
                          <circle r="12" fill="none" stroke="hsl(37,90%,60%)" strokeWidth="1" strokeOpacity="0.3" />
                        )}
                      </motion.g>
                    ))}
                  </motion.g>
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section id="product" className="mx-auto max-w-6xl px-6 py-20">
        <motion.p
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          The desk
        </motion.p>
        <motion.h2
          className="mt-2 font-display text-3xl font-semibold tracking-tight"
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          viewport={{ once: true }}
        >
          One dashboard, start to close.
        </motion.h2>

        <motion.div
          className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {pillars.map((p) => (
            <motion.div
              key={p.title}
              variants={fadeUp}
              className="group rounded-lg border border-border bg-card p-6 shadow-subtle transition-shadow hover:shadow-card cursor-default"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"
                whileHover={{ scale: 1.12, rotate: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <p.icon className="h-5 w-5" />
              </motion.div>
              <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.p
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Pricing
          </motion.p>
          <motion.h2
            className="mt-2 font-display text-3xl font-semibold tracking-tight"
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            viewport={{ once: true }}
          >
            Priced per rep, not per lead.
          </motion.h2>

          <motion.div
            className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {tiers.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                whileHover={
                  prefersReduced
                    ? {}
                    : t.featured
                    ? { y: -6, scale: 1.01 }
                    : { y: -3 }
                }
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className={cn(
                  "rounded-lg border p-6 transition-shadow",
                  t.featured
                    ? "border-primary bg-card shadow-glow-primary ring-1 ring-primary"
                    : "border-border bg-card shadow-subtle hover:shadow-card"
                )}
              >
                {t.featured && (
                  <span className="mb-3 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Most popular
                  </span>
                )}
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="mt-2 font-display text-3xl font-semibold">
                  {t.price}
                  <span className="text-sm font-normal text-muted-foreground">{t.period}</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-success shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <motion.div
                  className="mt-6"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="w-full" variant={t.featured ? "default" : "outline"}>
                    {t.name === "Enterprise" ? "Talk to sales" : "Start free trial"}
                  </Button>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-muted-foreground">
          <span>© 2026 GlobalReach, Inc.</span>
          <span className="manifest-chip">BUILT FOR 190+ MARKETS</span>
        </div>
      </footer>
    </main>
  );
}
