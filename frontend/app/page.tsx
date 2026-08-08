import Link from "next/link";
import { Globe2, ArrowRight, MapPin, KanbanSquare, PhoneCall, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const stats = [
  { value: "190+", label: "countries indexed" },
  { value: "4.2M", label: "businesses in reach" },
  { value: "23.8%", label: "avg. response rate" },
];

const pillars = [
  { icon: MapPin, title: "Discover", body: "Filter by industry, country, size, and radius, then work results as a list or a live map." },
  { icon: KanbanSquare, title: "Pipeline", body: "Drag leads through a board built for outreach: New, Contacted, Responded, Negotiating, Won." },
  { icon: PhoneCall, title: "Reach out", body: "Message and call from the same record, with every touch logged to the client's timeline." },
];

const tiers = [
  { name: "Starter", price: "$49", period: "/rep/mo", features: ["500 lead searches/mo", "1 pipeline board", "Email + chat outreach"] },
  { name: "Growth", price: "$129", period: "/rep/mo", features: ["Unlimited searches", "Unlimited boards", "Voice calling", "Team analytics"], featured: true },
  { name: "Enterprise", price: "Custom", period: "", features: ["SSO & role controls", "Dedicated onboarding", "API & data exports"] },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Globe2 className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">GlobalReach</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#product" className="hover:text-foreground">Product</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#" className="hover:text-foreground">Docs</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
          <Link href="/signup"><Button size="sm">Start free trial</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="animate-fade-up">
            <span className="manifest-chip">51.95N 4.14E · ROTTERDAM, NL</span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
              Find your next client, wherever they run their business.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              GlobalReach is the discovery and outreach CRM for teams selling across borders — search leads
              by industry and country, work them on a map, and run every message and call from one desk.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link href="/signup"><Button size="lg">Start free trial <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/dashboard"><Button size="lg" variant="outline">View live demo</Button></Link>
            </div>
            <div className="mt-10 flex gap-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl font-semibold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="rounded-xl border border-border bg-card p-3 shadow-popover">
              <div className="flex items-center gap-1.5 border-b border-border pb-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-2 font-mono text-[11px] text-muted-foreground">discovery — 8 pins plotted</span>
              </div>
              <div className="mt-3 h-72 rounded-lg bg-[hsl(224,33%,7%)] p-4">
                <svg viewBox="0 0 400 240" className="h-full w-full">
                  <defs>
                    <pattern id="hero-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M20 0 L0 0 0 20" fill="none" stroke="hsl(220,20%,20%)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="400" height="240" fill="url(#hero-grid)" />
                  {[[80, 60], [150, 130], [260, 90], [320, 150], [200, 40], [110, 170]].map(([x, y], i) => (
                    <g key={i} transform={`translate(${x} ${y})`}>
                      <circle r={i === 2 ? 7 : 4} fill={i === 2 ? "hsl(37,90%,60%)" : "hsl(228,100%,64%)"} stroke="white" strokeWidth="1.2" />
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section id="product" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">The desk</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">One dashboard, start to close.</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-lg border border-border p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pricing</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Priced per rep, not per lead.</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={cn(
                  "rounded-lg border p-6",
                  t.featured ? "border-primary bg-card shadow-card ring-1 ring-primary" : "border-border bg-card"
                )}
              >
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="mt-2 font-display text-3xl font-semibold">
                  {t.price}
                  <span className="text-sm font-normal text-muted-foreground">{t.period}</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant={t.featured ? "default" : "outline"}>
                  {t.name === "Enterprise" ? "Talk to sales" : "Start free trial"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-muted-foreground">
          <span>© 2026 GlobalReach, Inc.</span>
          <span className="font-mono">BUILT FOR 190+ MARKETS</span>
        </div>
      </footer>
    </main>
  );
}
