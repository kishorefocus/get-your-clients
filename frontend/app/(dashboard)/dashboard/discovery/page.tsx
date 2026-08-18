"use client";

import { useEffect, useMemo, useState } from "react";
import { List, Map as MapIcon, Columns2 } from "lucide-react";
import { Topbar } from "@/components/features/layout/topbar";
import { FilterSidebar, Filters } from "@/components/features/search/filter-sidebar";
import { LeadCard } from "@/components/features/search/lead-card";
import { MapView } from "@/components/features/search/map-view";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainerFast, fadeIn, fadeUp, springUI, tapProps } from "@/lib/motion";

type ViewMode = "list" | "map" | "split";

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
  const [view, setView] = useState<ViewMode>("split");
  const [activeId, setActiveId] = useState<string | null>(null);
  const leads = useLeadsStore((s) => s.leads);
  const isLoadingFromApi = useLeadsStore((s) => s.isLoadingFromApi);
  const fetchFromApi = useLeadsStore((s) => s.fetchFromApi);

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
    return leads.filter((l) => {
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
  }, [filters, leads]);

  console.log("results123 : ", results)
  console.log("leads : ", leads)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Discovery" />

      <div className="flex min-h-0 flex-1">
        <FilterSidebar filters={filters} onChange={setFilters} resultCount={results.length} />

        <div className="flex min-h-0 flex-1 flex-col">
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
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5 bg-muted/40 relative">
              <ViewButton icon={List} active={view === "list"} onClick={() => setView("list")} label="List" />
              <ViewButton icon={Columns2} active={view === "split"} onClick={() => setView("split")} label="Split" />
              <ViewButton icon={MapIcon} active={view === "map"} onClick={() => setView("map")} label="Map" />
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
        </div>
      </div>
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
