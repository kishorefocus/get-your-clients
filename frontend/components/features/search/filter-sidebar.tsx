"use client";

import { useState } from "react";
import { SlidersHorizontal, X, Save, Trash2, ChevronRight, ChevronDown, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { countries } from "@/lib/mock/leads";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { tapProps, springUI } from "@/lib/motion";
import { useIndustryTree } from "@/lib/hooks/use-industries";
import { IndustryTreeNode } from "@/lib/api/industries";
import {
  useSavedSearches,
  useCreateSavedSearch,
  useDeleteSavedSearch,
} from "@/lib/hooks/use-saved-searches";

export interface Filters {
  keyword: string;
  industry: string | null;
  industryId: string | null;
  country: string;
  city: string;
  limit: number;
  hasPhone: boolean;
  hasEmail: boolean;
  minRating: number;
  radiusKm: number;
}

export function FilterSidebar({
  filters,
  onChange,
  resultCount,
  isOpen,
  onClose,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  resultCount: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });

  // Industry tree
  const { data: industryTree = [] } = useIndustryTree();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Saved searches
  const { data: savedSearches = [] } = useSavedSearches();
  const createSavedSearchMutation = useCreateSavedSearch();
  const deleteSavedSearchMutation = useDeleteSavedSearch();
  const [searchSaveName, setSearchSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSaveName.trim()) return;
    try {
      await createSavedSearchMutation.mutateAsync({
        name: searchSaveName.trim(),
        query: {
          keyword: filters.keyword || undefined,
          industry_id: filters.industryId || undefined,
          country: filters.country || undefined,
          min_rating: filters.minRating || undefined,
          radius_km: filters.radiusKm || undefined,
        },
      });
      setSearchSaveName("");
      setShowSaveInput(false);
    } catch (err) {}
  };

  const handleApplySavedSearch = (s: any) => {
    onChange({
      keyword: s.query.keyword || "",
      industry: null, // Since we only store industryId in serialized search
      industryId: s.query.industry_id || null,
      country: s.query.country || "",
      city: s.query.city || "",
      limit: s.query.limit || 10,
      hasPhone: false,
      hasEmail: false,
      minRating: s.query.min_rating || 0,
      radiusKm: s.query.radius_km || 50,
    });
  };

  const handleDeleteSavedSearch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this saved search?")) {
      try {
        await deleteSavedSearchMutation.mutateAsync(id);
      } catch (err) {}
    }
  };

  // Recursive tree renderer
  const renderIndustryNode = (node: IndustryTreeNode, depth = 0) => {
    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = filters.industryId === node.id;

    return (
      <div key={node.id} className="space-y-1">
        <div
          onClick={() => {
            if (isSelected) {
              onChange({ ...filters, industry: null, industryId: null });
            } else {
              onChange({ ...filters, industry: node.name, industryId: node.id });
            }
          }}
          className={cn(
            "flex items-center gap-1 py-1 px-2 rounded-md text-xs cursor-pointer select-none transition-colors",
            isSelected
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          style={{ paddingLeft: `${Math.max(8, depth * 14)}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-0.5 hover:bg-muted rounded text-muted-foreground"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : (
            <span className="w-4 h-4 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map((child) => renderIndustryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          />

          {/* Sidebar Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-border bg-background/95 backdrop-blur-md shadow-2xl h-full"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" /> Filters
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    onChange({
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
                    })
                  }
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground flex items-center justify-center"
                  onClick={onClose}
                  title="Close Filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4 scrollbar-thin">
              {/* Saved Searches */}
              <div className="border-b border-border pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Bookmark className="h-3.5 w-3.5 text-primary" /> Saved Searches
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] gap-1 hover:text-primary"
                    onClick={() => setShowSaveInput(!showSaveInput)}
                  >
                    <Save className="h-3 w-3" /> Save current
                  </Button>
                </div>
                {showSaveInput && (
                  <form onSubmit={handleSaveSearch} className="flex gap-1.5 mb-3">
                    <Input
                      placeholder="Name this search..."
                      value={searchSaveName}
                      onChange={(e) => setSearchSaveName(e.target.value)}
                      className="h-7 text-xs bg-background/50"
                      required
                    />
                    <Button type="submit" size="sm" className="h-7 px-2 text-xs">
                      Save
                    </Button>
                  </form>
                )}
                <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                  {savedSearches.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleApplySavedSearch(s)}
                      className="flex items-center justify-between py-1 px-2 text-xs rounded-md cursor-pointer hover:bg-muted group/saved"
                    >
                      <span className="truncate text-muted-foreground group-hover/saved:text-foreground">
                        {s.name}
                      </span>
                      <button
                        onClick={(e) => handleDeleteSavedSearch(s.id, e)}
                        className="opacity-0 group-hover/saved:opacity-100 p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {savedSearches.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic text-center py-1">
                      No saved searches yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Keyword Search */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Keyword</label>
                <Input
                  placeholder="e.g. textile, robotics…"
                  value={filters.keyword}
                  onChange={(e) => set("keyword", e.target.value)}
                  className="focus-visible:ring-primary/20"
                />
              </div>

              {/* Hierarchical Industry Picker */}
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Industry Taxonomy</p>
                <div className="border border-border rounded-md p-2 bg-muted/20 max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
                  {industryTree.map((node) => renderIndustryNode(node))}
                  {industryTree.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic text-center py-4">
                      No industries returned from API.
                    </p>
                  )}
                </div>
              </div>

              {/* Place or City Input */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Place, City or District</label>
                <Input
                  placeholder="e.g. kerala, palakkad district, Austin…"
                  value={filters.city}
                  onChange={(e) => set("city", e.target.value)}
                  className="focus-visible:ring-primary/20"
                />
              </div>

              {/* Country Input */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Country</label>
                <Input
                  placeholder="e.g. US, India, France…"
                  value={filters.country}
                  onChange={(e) => set("country", e.target.value)}
                  className="focus-visible:ring-primary/20"
                />
              </div>

              {/* Result Count Input */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Result Count</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="e.g. 10"
                  value={filters.limit}
                  onChange={(e) => set("limit", Number(e.target.value))}
                  className="focus-visible:ring-primary/20"
                />
              </div>

              {/* Radius Search */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Search radius</span>
                  <span className="font-mono text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">{filters.radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={filters.radiusKm}
                  onChange={(e) => set("radiusKm", Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Min Rating Slider */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Minimum rating</span>
                  <span className="font-mono text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">{filters.minRating.toFixed(1)}+</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={filters.minRating}
                  onChange={(e) => set("minRating", Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Compliances */}
              <div className="space-y-2.5 pt-2 border-t border-border/50">
                <Toggle label="Has phone number" checked={filters.hasPhone} onChange={(v) => set("hasPhone", v)} />
                <Toggle label="Has email" checked={filters.hasEmail} onChange={(v) => set("hasEmail", v)} />
              </div>
            </div>

            <div className="border-t border-border p-4 bg-muted/20">
              <p className="text-center text-xs text-muted-foreground">
                <span className="font-mono font-medium text-foreground bg-muted px-1.5 py-0.5 rounded mr-1">{resultCount}</span> businesses match
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      onClick={onClick}
      {...tapProps}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 focus-visible:outline-ring",
        active 
          ? "border-primary bg-primary/10 text-primary shadow-subtle" 
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </motion.button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm group">
      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors focus-visible:outline-ring", 
          checked ? "bg-primary" : "bg-muted border border-border"
        )}
      >
        <motion.span
          layout
          transition={springUI}
          className={cn(
            "absolute top-[2px] h-3.5 w-3.5 rounded-full bg-background shadow-subtle",
            checked ? "right-[2px]" : "left-[2px]"
          )}
        />
      </button>
    </label>
  );
}
