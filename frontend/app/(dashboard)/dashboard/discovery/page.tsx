"use client";

import { useMemo, useState } from "react";
import { List, Map as MapIcon, Columns2 } from "lucide-react";
import { Topbar } from "@/components/features/layout/topbar";
import { FilterSidebar, Filters } from "@/components/features/search/filter-sidebar";
import { LeadCard } from "@/components/features/search/lead-card";
import { MapView } from "@/components/features/search/map-view";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "map" | "split";

const defaultFilters: Filters = {
  keyword: "",
  industry: null,
  country: null,
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

  const results = useMemo(() => {
    return leads.filter((l) => {
      if (filters.keyword && !`${l.name} ${l.category}`.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
      if (filters.industry && l.industry !== filters.industry) return false;
      if (filters.country && l.country !== filters.country) return false;
      if (filters.hasPhone && !l.phone) return false;
      if (filters.hasEmail && !l.email) return false;
      if (filters.minRating && (l.rating ?? 0) < filters.minRating) return false;
      if (filters.radiusKm && (l.distanceKm ?? 0) > filters.radiusKm) return false;
      return true;
    });
  }, [filters, leads]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Discovery" />

      <div className="flex min-h-0 flex-1">
        <FilterSidebar filters={filters} onChange={setFilters} resultCount={results.length} />

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2.5">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{results.length}</span> results
              {filters.country ? ` in ${filters.country}` : " worldwide"}
            </p>
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              <ViewButton icon={List} active={view === "list"} onClick={() => setView("list")} label="List" />
              <ViewButton icon={Columns2} active={view === "split"} onClick={() => setView("split")} label="Split" />
              <ViewButton icon={MapIcon} active={view === "map"} onClick={() => setView("map")} label="Map" />
            </div>
          </div>

          <div className="flex min-h-0 flex-1">
            {view !== "map" && (
              <div
                className={cn(
                  "min-h-0 space-y-3 overflow-y-auto p-4 scrollbar-thin",
                  view === "split" ? "w-full max-w-md border-r border-border" : "w-full"
                )}
              >
                {results.length === 0 ? (
                  <EmptyState />
                ) : (
                  results.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} active={activeId === lead.id} onHover={setActiveId} onSelect={setActiveId} />
                  ))
                )}
              </div>
            )}

            {view !== "list" && (
              <div className="min-h-0 flex-1">
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
    <button
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
      <p className="text-sm font-medium">No businesses match these filters</p>
      <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
        Try widening the search radius or clearing a filter to see more results.
      </p>
    </div>
  );
}
