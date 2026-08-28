"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  List, Map as MapIcon, Columns2, 
  Sparkles, Brain, MapPin, Building, Search, 
  Briefcase, CheckCircle2, RotateCcw, ChevronDown, ChevronUp, X 
} from "lucide-react";
import { Topbar } from "@/components/features/layout/topbar";
import { Button } from "@/components/ui/button";
import { FilterSidebar, Filters } from "@/components/features/search/filter-sidebar";
import { LeadCard } from "@/components/features/search/lead-card";
import { MapView } from "@/components/features/search/map-view";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { useMyOrg } from "@/lib/hooks/use-org";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainerFast, fadeIn, fadeUp, springUI, tapProps, cardHoverProps } from "@/lib/motion";

type ViewMode = "list" | "map" | "split";

export interface BusinessTemplate {
  category: string;
  idealClients: string;
  searchKeywords: string[];
}

export const BUSINESS_TEMPLATES = [
  // Tech & Digital Agencies
  {
    category: "App & Web Development Company",
    idealClients: "Local brick-and-mortar stores needing e-commerce setups, established offline businesses looking to modernize, and funded startups requiring custom platforms.",
    searchKeywords: ["retail store", "e-commerce setups", "startups"]
  },
  {
    category: "AI Automation Agency",
    idealClients: "Real estate agencies, online retailers, and customer support centers looking to deploy AI chatbots and automate workflows.",
    searchKeywords: ["real estate agency", "online retail", "customer support center"]
  },
  {
    category: "SaaS (Software as a Service) Provider",
    idealClients: "Niche business owners (e.g., salon management software for salon owners, scheduling tools for personal trainers).",
    searchKeywords: ["salon", "personal trainer", "fitness studio"]
  },
  {
    category: "SEO & Content Strategy Firm",
    idealClients: "High-ticket local service providers like law firms, medical clinics, and dental practices wanting to rank higher on Google.",
    searchKeywords: ["law firm", "medical clinic", "dental practice"]
  },
  {
    category: "Personal Brand Marketing Agency",
    idealClients: "Corporate executives, startup founders, authors, and high-earning consultants looking to build their LinkedIn or personal audience.",
    searchKeywords: ["consulting firm", "startup founder", "executive coaching"]
  },
  {
    category: "Ghostwriting Services",
    idealClients: "Busy CEOs, venture capitalists, and industry experts who need high-quality essays, books, or newsletters written under their name.",
    searchKeywords: ["ceo office", "venture capital firm", "consultancy"]
  },
  {
    category: "Virtual Assistant (VA) Agency",
    idealClients: "Solo entrepreneurs, digital creators, and small business owners overwhelmed by administrative tasks and emails.",
    searchKeywords: ["solopreneur", "digital creator", "small business"]
  },
  {
    category: "Gamified Learning & EdTech Developer",
    idealClients: "Corporate HR departments looking for interactive onboarding programs, and private K-12 schools seeking digital learning tools.",
    searchKeywords: ["corporate HR", "private school", "learning academy"]
  },
  {
    category: "IT & Remote Tech Support",
    idealClients: "Local accounting firms, law offices, and small businesses without an in-house IT department.",
    searchKeywords: ["accounting firm", "law office", "small business"]
  },
  {
    category: "Virtual Reality (VR) Training Agency",
    idealClients: "Industrial manufacturing plants, aviation schools, and medical institutions needing risk-free simulation training for staff.",
    searchKeywords: ["manufacturing plant", "aviation school", "medical institution"]
  },
  // Professional & Lifestyle Services
  {
    category: "Online Coaching & Consulting",
    idealClients: "Mid-career professionals seeking career pivots, or individuals looking for specialized language or business skills.",
    searchKeywords: ["professional services", "career coaching", "language school"]
  },
  {
    category: "Property Management Agency",
    idealClients: "Busy real estate investors, out-of-state landlords, and multi-property owners who don't want to handle tenant issues.",
    searchKeywords: ["real estate investor", "landlord", "apartment complex"]
  },
  {
    category: "Daycare Services",
    idealClients: "Dual-income households, busy working parents, and families without nearby childcare support.",
    searchKeywords: ["working parents", "family household", "daycare needs"]
  },
  {
    category: "Personal Styling & Wardrobe Consulting",
    idealClients: "High-profile professionals, public speakers, and individuals undergoing major life or career transitions.",
    searchKeywords: ["public speaker", "executive", "professional studio"]
  },
  {
    category: "Home Organization & Decluttering",
    idealClients: "Affluent families moving into new homes, downsizers, and busy professionals struggling with chaotic living spaces.",
    searchKeywords: ["moving company", "family residence", "real estate office"]
  },
  {
    category: "Mobile Pet Grooming",
    idealClients: "Elderly pet owners, busy remote workers, and owners of highly anxious pets who prefer at-home service.",
    searchKeywords: ["pet owner", "veterinary clinic", "dog training center"]
  },
  {
    category: "Eco-Friendly Residential Cleaning",
    idealClients: "Health-conscious families, professionals with demanding schedules, and Airbnb hosts requiring fast turnovers.",
    searchKeywords: ["airbnb host", "residential family", "boutique hotel"]
  },
  // Food, Hospitality & Retail
  {
    category: "Hybrid Bar & Coffee Shop",
    idealClients: "Remote workers and students during the day; young professionals, couples, and social groups during evenings and weekends.",
    searchKeywords: ["remote worker", "student association", "young professional group"]
  },
  {
    category: "Catering Services",
    idealClients: "Event planners, corporate office managers hosting luncheons, and couples planning weddings.",
    searchKeywords: ["event planner", "office manager", "wedding coordinator"]
  },
  {
    category: "Cloud Kitchen or Artisan Bakery",
    idealClients: "Local food enthusiasts, people celebrating birthdays/events, and local cafes looking to outsource their pastry inventory.",
    searchKeywords: ["local cafe", "bakery outlet", "restaurant"]
  },
  {
    category: "Specialty Beverage Brand",
    idealClients: "Health-conscious consumers, millennials, and sober-curious individuals looking for premium, non-alcoholic lifestyle drinks.",
    searchKeywords: ["health store", "cafe", "supermarket"]
  },
  {
    category: "Fitness Studio & Gym",
    idealClients: "Health-conscious individuals, local residents looking for community-driven workouts, and fitness enthusiasts.",
    searchKeywords: ["local resident", "fitness club", "gym enthusiast"]
  },
  {
    category: "Salon & Barbershop",
    idealClients: "Neighborhood residents, professionals maintaining a groomed appearance, and clients seeking specialized hair treatments.",
    searchKeywords: ["neighborhood resident", "groomed professional", "hair clinic"]
  },
  {
    category: "Personal Styling Boutique",
    idealClients: "Local fashion enthusiasts looking for unique apparel curated away from mass-market fast fashion.",
    searchKeywords: ["fashion designer", "local boutique", "apparel brand"]
  },
  // E-Commerce & Supply Chain
  {
    category: "Dropshipping Business",
    idealClients: "Retail bargain hunters, impulse social media buyers, and consumers looking for trendy novelty products.",
    searchKeywords: ["bargain hunter", "impulse buyer", "retail outlet"]
  },
  {
    category: "Online Resale Store",
    idealClients: "Eco-conscious shoppers, vintage fashion collectors, and budget-focused parents looking for gently used children's items.",
    searchKeywords: ["vintage collector", "eco shopper", "thrift shop"]
  },
  {
    category: "Eco-Friendly Household Products Shop",
    idealClients: "Zero-waste advocates, environmentally conscious homeowners, and sustainable lifestyle enthusiasts.",
    searchKeywords: ["homeowner", "zero waste advocate", "sustainable store"]
  },
  {
    category: "Handmade Crafts (Etsy/Direct)",
    idealClients: "Gift shoppers looking for personalized items, home decorators seeking unique art pieces, and collectors.",
    searchKeywords: ["gift shop", "interior designer", "home decorator"]
  },
  {
    category: "Organic Farming & Produce Delivery",
    idealClients: "Health-conscious families, farm-to-table restaurants, and local culinary enthusiasts who value fresh, pesticide-free food.",
    searchKeywords: ["farm to table restaurant", "local family", "gourmet chef"]
  },
  {
    category: "Waste Removal & Recycling Service",
    idealClients: "Homeowners undergoing renovations, property managers cleaning out evicted units, and commercial construction sites.",
    searchKeywords: ["contractor", "property manager", "renovation service"]
  }
];

export const BUSINESS_GROUPS = {
  "Tech & Digital": BUSINESS_TEMPLATES.slice(0, 10),
  "Services": BUSINESS_TEMPLATES.slice(10, 17),
  "Food & Retail": BUSINESS_TEMPLATES.slice(17, 24),
  "E-Commerce": BUSINESS_TEMPLATES.slice(24, 30)
};

function parseLocation(locStr: string): { city: string; country: string } {
  if (!locStr) return { city: "", country: "" };
  const parts = locStr.split(",").map(p => p.trim());
  if (parts.length === 1) {
    return { city: parts[0], country: "" };
  }
  return { city: parts[0], country: parts[parts.length - 1] };
}

const defaultFilters: Filters = {
  keyword: "",
  industry: null,
  industryId: null,
  country: "",
  city: "",
  limit: 10,
  hasPhone: false,
  hasEmail: false,
  minRating: 0,
  radiusKm: 50,
};

export default function DiscoveryPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const leads = useLeadsStore((s) => s.leads);
  const isLoadingFromApi = useLeadsStore((s) => s.isLoadingFromApi);
  const fetchFromApi = useLeadsStore((s) => s.fetchFromApi);

  const { data: myOrg } = useMyOrg();
  const isFree = myOrg?.plan === "free";

  // AI Finder Wizard states
  const [yourBusinessName, setYourBusinessName] = useState("");
  const [yourLocation, setYourLocation] = useState("");
  const [clientLocation, setClientLocation] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof BUSINESS_TEMPLATES[number] | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Tech & Digital");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [isWizardCollapsed, setIsWizardCollapsed] = useState(false);
  const [aiReport, setAiReport] = useState<{
    businessName: string;
    businessLocation: string;
    targetLocation: string;
    idealClients: string;
    keywords: string[];
  } | null>(null);
  const [selectedKeywordIndex, setSelectedKeywordIndex] = useState<number>(0);

  // Fetch real clients from backend on mount
  useEffect(() => {
    fetchFromApi({
      keyword: filters.keyword || undefined,
      country: filters.country || undefined,
      city: filters.city || undefined,
      limit: filters.limit || undefined,
      industry_id: filters.industryId || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when keyword/country/city/limit/industry filter changes (debounced via useMemo dependency)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchFromApi({
        keyword: filters.keyword || undefined,
        country: filters.country || undefined,
        city: filters.city || undefined,
        limit: filters.limit || undefined,
        industry_id: filters.industryId || undefined,
        min_rating: filters.minRating || undefined,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [filters.keyword, filters.country, filters.city, filters.limit, filters.industryId, filters.minRating, fetchFromApi]);

  const results = useMemo(() => {
    console.log("useMemo run with filters:", filters, "leads count:", leads.length);
    const filtered = leads.filter((l) => {
      const isMock = l.id.startsWith("l");

      if (isMock) {
        // Apply strict client-side filtering to mock leads
        if (filters.keyword) {
          const matchesName = l.name.toLowerCase().includes(filters.keyword.toLowerCase());
          const matchesCategory = l.category.toLowerCase().includes(filters.keyword.toLowerCase());
          if (!matchesName && !matchesCategory) return false;
        }
        if (filters.industryId && l.industryId !== filters.industryId) return false;

        if (filters.country) {
          const countryTerm = filters.country.toLowerCase();
          const matchesCountryName = l.country ? l.country.toLowerCase().includes(countryTerm) : false;
          const matchesCountryCode = l.countryCode ? l.countryCode.toLowerCase().includes(countryTerm) : false;
          const matchesAddress = l.address ? l.address.toLowerCase().includes(countryTerm) : false;
          if (!matchesCountryName && !matchesCountryCode && !matchesAddress) return false;
        }

        if (filters.city) {
          const cityTerm = filters.city.toLowerCase();
          const matchesCityName = l.city ? l.city.toLowerCase().includes(cityTerm) : false;
          const matchesAddress = l.address ? l.address.toLowerCase().includes(cityTerm) : false;
          if (!matchesCityName && !matchesAddress) return false;
        }

        if (filters.hasPhone && !l.phone) return false;
        if (filters.hasEmail && !l.email) return false;
        if (filters.minRating && (l.rating ?? 0) < filters.minRating) return false;
        if (filters.radiusKm && l.distanceKm != null && l.distanceKm > filters.radiusKm) return false;
        return true;
      } else {
        // For real API leads, the API already filtered by keyword/city/country.
        // We only filter by dynamic criteria like phone, email, rating, and radius locally.
        if (filters.hasPhone && !l.phone) return false;
        if (filters.hasEmail && !l.email) return false;
        if (filters.minRating && (l.rating ?? 0) < filters.minRating) return false;
        if (filters.radiusKm && l.distanceKm != null && l.distanceKm > filters.radiusKm) return false;
        return true;
      }
    });

    return filtered.map((l, index) => {
      if (isFree) {
        const isClaimed = l.savedByMe || l.stage !== "new";
        const shouldLock = index >= 3 && !isClaimed;
        return {
          ...l,
          isLocked: l.id.startsWith("l") ? shouldLock : (l.isLocked || shouldLock)
        };
      }
      return { ...l, isLocked: false };
    });
  }, [filters, leads, isFree]);

  const handleTemplateSelect = (template: typeof BUSINESS_TEMPLATES[number]) => {
    setSelectedTemplate(template);
    setYourBusinessName(template.category);
  };

  const handleAiSearch = () => {
    if (!yourBusinessName.trim()) {
      alert("Please select a business bubble or type your business type.");
      return;
    }
    if (!clientLocation.trim()) {
      alert("Please enter target location for clients.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Simulate AI pipeline progression
    setTimeout(() => {
      setAnalysisStep(1);
      setTimeout(() => {
        setAnalysisStep(2);
        setTimeout(() => {
          setIsAnalyzing(false);
          const currentTemplate = selectedTemplate || BUSINESS_TEMPLATES.find(t => 
            t.category.toLowerCase().includes(yourBusinessName.toLowerCase())
          ) || {
            category: yourBusinessName,
            idealClients: `Custom Persona: Local businesses in need of ${yourBusinessName} services.`,
            searchKeywords: [yourBusinessName, "services", "agencies"]
          };

          const report = {
            businessName: yourBusinessName,
            businessLocation: yourLocation || "Global",
            targetLocation: clientLocation,
            idealClients: currentTemplate.idealClients,
            keywords: currentTemplate.searchKeywords
          };

          setAiReport(report);
          setSelectedKeywordIndex(0);

          // Parse and trigger api search
          const parsed = parseLocation(clientLocation);
          const queryKeyword = currentTemplate.searchKeywords[0];
          
          setFilters(prev => ({
            ...prev,
            keyword: queryKeyword,
            city: parsed.city,
            country: parsed.country
          }));
        }, 600);
      }, 600);
    }, 400);
  };

  const handleKeywordSelect = (index: number) => {
    if (!aiReport) return;
    setSelectedKeywordIndex(index);
    const kw = aiReport.keywords[index];
    const parsed = parseLocation(aiReport.targetLocation);
    setFilters(prev => ({
      ...prev,
      keyword: kw,
      city: parsed.city,
      country: parsed.country
    }));
  };

  const handleResetAi = () => {
    setAiReport(null);
    setYourBusinessName("");
    setSelectedTemplate(null);
    setYourLocation("");
    setClientLocation("");
    setFilters(defaultFilters);
  };

  console.log("results123 : ", results)
  console.log("leads : ", leads)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Discovery" />

      <div className="flex min-h-0 flex-1">
        <FilterSidebar filters={filters} onChange={setFilters} resultCount={results.length} isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

        <div className="flex min-h-0 flex-1 flex-col bg-background/50">
          
          {!hasSearched ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center p-8 py-24 text-center max-w-2xl mx-auto flex-1 min-h-[60vh]"
            >
              {/* Visual Icon Area with Glowing Aura */}
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-125 animate-pulse" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent border border-primary-foreground/20 text-white shadow-xl shadow-primary/25">
                  <Brain className="h-11 w-11 text-white animate-pulse" />
                  <Sparkles className="absolute -top-1.5 -right-1.5 h-6 w-6 text-accent animate-bounce" />
                </div>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-display sm:text-4xl mb-4">
                Find Your Ideal Clients using AI
              </h1>
              
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-8">
                Use our AI Persona Discovery engine to analyze your business model, scan local profiles, and map out your target market in seconds.
              </p>

              <div className="flex flex-col gap-4 items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsWizardOpen(true)}
                  className="h-14 px-10 rounded-full bg-gradient-to-r from-primary via-primary to-accent hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-primary/25 flex items-center gap-2.5 tracking-wider uppercase font-mono border border-primary-foreground/10"
                >
                  <Sparkles className="h-5 w-5 fill-white/20 text-white" />
                  Start AI Persona Finder
                </motion.button>
                
                <button
                  onClick={() => {
                    setHasSearched(true);
                    setView("split");
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors hover:underline"
                >
                  Or browse database manually
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2.5">
                <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                  {isLoadingFromApi ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={results.length}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="font-mono text-foreground font-semibold"
                      >
                        {results.length}
                      </motion.span>
                    </AnimatePresence>
                  )}
                  <span>
                    results {filters.country ? ` in ${filters.country}` : " worldwide"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs border-border bg-card shadow-subtle hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <Search className="h-3.5 w-3.5" />
                    Filters
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white font-semibold shadow-subtle flex items-center animate-pulse"
                    onClick={() => setIsWizardOpen(true)}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-white fill-white/20" />
                    AI Persona Finder
                  </Button>
                  <div className="flex items-center gap-1 rounded-md border border-border p-0.5 bg-muted/40 relative">
                    <ViewButton icon={List} active={view === "list"} onClick={() => setView("list")} label="List" />
                    <ViewButton icon={Columns2} active={view === "split"} onClick={() => setView("split")} label="Split" />
                    <ViewButton icon={MapIcon} active={view === "map"} onClick={() => setView("map")} label="Map" />
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {view !== "map" && (
                <motion.div
                  key="list-view"
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={cn(
                    "min-h-0 space-y-3 overflow-y-auto p-4 scrollbar-thin",
                    view === "split" ? "w-full max-w-md border-r border-border bg-background/50" : "w-full"
                  )}
                >
                  {results.length === 0 ? (
                    <EmptyState key="empty" />
                  ) : (
                    <motion.div
                      key="staggered-leads"
                      variants={staggerContainerFast}
                      initial="hidden"
                      animate="visible"
                      className="space-y-3"
                    >
                      {results.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} active={activeId === lead.id} onHover={setActiveId} onSelect={setActiveId} />
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {view !== "list" && (
              <div className="min-h-0 flex-1 relative bg-surface">
                <MapView leads={results} activeId={activeId} onHover={setActiveId} onSelect={setActiveId} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </div>

  {/* AI Persona Analysis Modal */}
  <AnimatePresence>
    {isWizardOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsWizardOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-surface p-6 shadow-2xl z-10 scrollbar-thin"
        >
          {/* Close Button */}
          <button
            onClick={() => setIsWizardOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors z-20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Wizard Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2 pr-8">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Brain className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                    AI Client Discovery Engine <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">BETA</span>
                  </h2>
                  <p className="text-[11px] text-muted-foreground">Select your business type and client location to identify target prospects.</p>
                </div>
              </div>
              {(yourBusinessName || clientLocation || aiReport) && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover:text-danger hover:bg-danger/10" onClick={handleResetAi}>
                  <RotateCcw className="h-3 w-3" /> Clear Scan
                </Button>
              )}
            </div>

            {/* Tabs & Bubbles Grid */}
            <div className="space-y-2">
              <div className="flex border-b border-border/60 pb-1 gap-4 overflow-x-auto scrollbar-none">
                {Object.keys(BUSINESS_GROUPS).map((group) => (
                  <button
                    key={group}
                    onClick={() => setActiveTab(group)}
                    className={cn(
                      "text-xs font-semibold pb-1 border-b-2 px-1 transition-colors whitespace-nowrap",
                      activeTab === group
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {group}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-muted/20 rounded-md scrollbar-thin">
                {BUSINESS_GROUPS[activeTab as keyof typeof BUSINESS_GROUPS].map((t) => {
                  const isSelected = selectedTemplate?.category === t.category;
                  return (
                    <button
                      key={t.category}
                      onClick={() => handleTemplateSelect(t)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150 focus-visible:outline-ring",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-subtle"
                          : "border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground bg-card"
                      )}
                    >
                      {t.category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs & AI Report Grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Building className="h-3 w-3" /> Your Business
                    </label>
                    <input
                      type="text"
                      value={yourBusinessName}
                      onChange={(e) => {
                        setYourBusinessName(e.target.value);
                        setSelectedTemplate(null);
                      }}
                      placeholder="e.g. Apex AI Labs"
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Your Location
                    </label>
                    <input
                      type="text"
                      value={yourLocation}
                      onChange={(e) => setYourLocation(e.target.value)}
                      placeholder="e.g. Palakkad, Kerala"
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Search className="h-3 w-3" /> Target Client Location
                    </label>
                    <input
                      type="text"
                      value={clientLocation}
                      onChange={(e) => setClientLocation(e.target.value)}
                      placeholder="e.g. London, UK"
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-muted-foreground italic">
                    * AI searches local Google Places + maps profiles dynamically in your target area.
                  </p>
                  <Button
                    size="sm"
                    className="h-8 px-4 text-xs gap-1.5 bg-gradient-to-r from-primary to-accent hover:opacity-95 shadow-md shadow-primary/10"
                    onClick={handleAiSearch}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border border-background border-t-transparent" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-primary-foreground fill-primary-foreground/25" />
                        Identify Clients & Search
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* AI Report Card */}
              <div className="lg:col-span-1 rounded-xl border border-border/85 bg-card/40 backdrop-blur-md p-4 min-h-[220px] flex flex-col justify-between relative overflow-hidden shadow-inner">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-6 flex-1 space-y-4">
                    {/* Futuristic Radar Scanner */}
                    <div className="relative h-16 w-16 flex items-center justify-center">
                      {/* Radar Sweep Line */}
                      <motion.div
                        className="absolute inset-0 rounded-full border border-primary/20 bg-gradient-to-tr from-primary/10 to-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      />
                      {/* Concentric Pulsating Rings */}
                      <motion.div
                        className="absolute inset-0 rounded-full border border-primary/40"
                        initial={{ scale: 0.6, opacity: 0.8 }}
                        animate={{ scale: 1.2, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border border-accent/30"
                        initial={{ scale: 0.4, opacity: 1 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.8, delay: 0.4, ease: "easeOut" }}
                      />
                      {/* Center Brain Icon */}
                      <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 border border-primary/40 shadow-lg shadow-primary/20">
                        <Brain className="h-5 w-5 text-primary animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-center relative z-10">
                      <p className="text-[11px] font-semibold text-foreground tracking-wide uppercase font-mono">AI Scan Pipeline</p>
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <motion.p 
                          key={analysisStep}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-[10px] text-muted-foreground font-medium animate-pulse"
                        >
                          {analysisStep === 0 && "🧬 Analyzing business model..."}
                          {analysisStep === 1 && "🎯 Mapping ideal client profiles..."}
                          {analysisStep === 2 && "📡 Identifying regional targets..."}
                        </motion.p>
                        {/* Step Dots */}
                        <div className="flex gap-1.5 mt-1 justify-center">
                          {[0, 1, 2].map((s) => (
                            <div
                              key={s}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full transition-all duration-300",
                                analysisStep === s 
                                  ? "bg-primary scale-125 shadow-sm shadow-primary"
                                  : s < analysisStep 
                                  ? "bg-success" 
                                  : "bg-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : aiReport ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="space-y-3 flex-1 flex flex-col justify-between h-full"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] bg-gradient-to-r from-primary to-accent text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold shadow-sm shadow-primary/10">Ideal Persona Profile</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-foreground font-medium bg-card/60 p-2.5 rounded-lg border border-border/65 shadow-subtle max-h-24 overflow-y-auto scrollbar-thin">
                        {aiReport.idealClients}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2.5 border-t border-border/60">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Identified Client Types (Click to Search)</span>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scrollbar-none">
                        {aiReport.keywords.map((kw, i) => (
                          <motion.button
                            key={kw}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleKeywordSelect(i)}
                            className={cn(
                              "text-[10px] px-2.5 py-1 rounded-full border transition-all duration-150 relative overflow-hidden",
                              selectedKeywordIndex === i
                                ? "border-primary bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/15"
                                : "border-border bg-card/80 hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {kw}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Get Clients Button */}
                    <div className="pt-2 border-t border-border/60">
                      <Button
                        onClick={() => {
                          setIsWizardOpen(false);
                          setHasSearched(true);
                          setView("split");
                          const parsed = parseLocation(aiReport.targetLocation);
                          const kw = aiReport.keywords[selectedKeywordIndex];
                          setFilters(prev => ({
                            ...prev,
                            keyword: kw,
                            city: parsed.city,
                            country: parsed.country
                          }));
                        }}
                        disabled={selectedKeywordIndex === null || selectedKeywordIndex === undefined}
                        className="w-full h-8 text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white"
                      >
                        Get Clients
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 flex-1 text-center space-y-2">
                    <Sparkles className="h-6 w-6 text-muted-foreground/60 animate-pulse" />
                    <p className="text-xs font-semibold text-muted-foreground">AI Persona Analysis</p>
                    <p className="text-[10px] text-muted-foreground max-w-[200px]">Select bubbles or enter details to see identified ideal clients.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
</div>
  );
}

function ViewButton({ icon: Icon, active, onClick, label }: { icon: any; active: boolean; onClick: () => void; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      {...tapProps}
      aria-pressed={active}
      title={label}
      className={cn(
        "relative flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors focus-visible:outline-ring z-10",
        active ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="active-view-bg"
          className="absolute inset-0 rounded bg-primary"
          transition={springUI}
          style={{ zIndex: -1 }}
        />
      )}
      <Icon className="h-3.5 w-3.5" />
      {label}
    </motion.button>
  );
}

function EmptyState() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center bg-card shadow-subtle"
    >
      <span className="manifest-chip mb-3">0 · RESULTS</span>
      <p className="text-sm font-semibold">No businesses match these filters</p>
      <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
        Try widening the search radius or clearing a filter to see more results.
      </p>
    </motion.div>
  );
}
