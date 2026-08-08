"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { industries, countries } from "@/lib/mock/leads";
import { cn } from "@/lib/utils";

export interface Filters {
  keyword: string;
  industry: string | null;
  country: string | null;
  hasPhone: boolean;
  hasEmail: boolean;
  minRating: number;
  radiusKm: number;
}

export function FilterSidebar({
  filters,
  onChange,
  resultCount,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  resultCount: number;
}) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-background lg:flex">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={() =>
            onChange({ keyword: "", industry: null, country: null, hasPhone: false, hasEmail: false, minRating: 0, radiusKm: 50 })
          }
        >
          <X className="h-3 w-3" /> Clear
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4 scrollbar-thin">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Keyword</label>
          <Input
            placeholder="e.g. textile, robotics…"
            value={filters.keyword}
            onChange={(e) => set("keyword", e.target.value)}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Industry</p>
          <div className="flex flex-wrap gap-1.5">
            {industries.map((i) => (
              <Chip key={i} active={filters.industry === i} onClick={() => set("industry", filters.industry === i ? null : i)}>
                {i}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Country</p>
          <div className="flex flex-wrap gap-1.5">
            {countries.map((c) => (
              <Chip key={c} active={filters.country === c} onClick={() => set("country", filters.country === c ? null : c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Search radius</span>
            <span className="font-mono">{filters.radiusKm} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={200}
            value={filters.radiusKm}
            onChange={(e) => set("radiusKm", Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Minimum rating</span>
            <span className="font-mono">{filters.minRating.toFixed(1)}+</span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={filters.minRating}
            onChange={(e) => set("minRating", Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="space-y-2">
          <Toggle label="Has phone number" checked={filters.hasPhone} onChange={(v) => set("hasPhone", v)} />
          <Toggle label="Has email" checked={filters.hasEmail} onChange={(v) => set("hasEmail", v)} />
        </div>
      </div>

      <div className="border-t border-border p-4">
        <p className="text-center text-xs text-muted-foreground">
          <span className="font-mono font-medium text-foreground">{resultCount}</span> businesses match
        </p>
      </div>
    </aside>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm">
      <span>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-primary" : "bg-muted")}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-background shadow-subtle transition-transform",
            checked ? "translate-x-4.5 left-0.5" : "left-0.5"
          )}
        />
      </button>
    </label>
  );
}
