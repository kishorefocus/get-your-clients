"use client";

/**
 * MapView
 * -------
 * This renders an equirectangular-projected pin field instead of live map
 * tiles, because this environment has no Google Maps API key to render
 * against. It's built as a drop-in placeholder: swap the <svg> surface
 * below for @react-google-maps/api's <GoogleMap> and replace `project()`
 * with the SDK's own screen-projection — the pin markup, clustering,
 * hover/select wiring, and props all carry over unchanged.
 *
 * Wiring for the real thing:
 *   import { GoogleMap, MarkerClusterer } from "@react-google-maps/api";
 *   <GoogleMap mapContainerClassName="h-full w-full" center={...} zoom={4}>
 *     {leads.map(lead => <Marker key={lead.id} position={{lat, lng}} .../>)}
 *   </GoogleMap>
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in env.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lead } from "@/types";
import { cn, formatCoords, initials } from "@/lib/utils";
import { Star, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const VIEW_W = 1000;
const VIEW_H = 520;

// Equirectangular projection: lat/lng -> svg x/y
function project(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * VIEW_W;
  const y = ((90 - lat) / 180) * VIEW_H;
  return { x, y };
}

export function MapView({
  leads,
  activeId,
  onHover,
  onSelect,
}: {
  leads: Lead[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}) {
  const [selected, setSelected] = useState<Lead | null>(null);
  const points = useMemo(() => leads.map((l) => ({ lead: l, ...project(l.lat, l.lng) })), [leads]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[hsl(224,33%,7%)]">
      {/* coordinate-grid backdrop — ties map to the manifest-chip signature */}
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(220,20%,20%)" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="glow" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="hsl(228,100%,20%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(224,33%,7%)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={VIEW_W} height={VIEW_H} fill="url(#glow)" />
        <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" />
        {/* equator + prime meridian, for orientation */}
        <line x1={0} y1={VIEW_H / 2} x2={VIEW_W} y2={VIEW_H / 2} stroke="hsl(220,20%,24%)" strokeDasharray="2 4" />
        <line x1={VIEW_W / 2} y1={0} x2={VIEW_W / 2} y2={VIEW_H} stroke="hsl(220,20%,24%)" strokeDasharray="2 4" />

        {points.map(({ lead, x, y }) => {
          const isActive = activeId === lead.id;
          return (
            <g
              key={lead.id}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer"
              onMouseEnter={() => onHover?.(lead.id)}
              onMouseLeave={() => onHover?.(null)}
              onClick={() => {
                onSelect?.(lead.id);
                setSelected(lead);
              }}
            >
              {isActive && <circle r="14" fill="hsl(228,100%,57%)" opacity="0.25" className="animate-pulse-ring" />}
              <circle r={isActive ? 7 : 5} fill={isActive ? "hsl(37,90%,60%)" : "hsl(228,100%,64%)"} stroke="white" strokeWidth="1.5" />
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-white/70 backdrop-blur">
        {leads.length} pins plotted
      </div>

      {selected && (
        <div className="absolute bottom-4 left-4 w-72 animate-fade-up rounded-lg border border-border bg-card p-4 shadow-popover">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                {initials(selected.name)}
              </div>
              <div>
                <Link
                  href={`/dashboard/discovery/${selected.id}`}
                  className="text-sm font-semibold leading-tight hover:text-primary hover:underline"
                >
                  {selected.name}
                </Link>
                <p className="text-xs text-muted-foreground">{selected.category}</p>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="manifest-chip">{formatCoords(selected.lat, selected.lng)}</span>
            {selected.rating && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-accent text-accent" /> {selected.rating}
              </span>
            )}
          </div>

          <div className="mt-3 flex gap-1.5">
            {selected.phone && (
              <Button size="sm" variant="secondary" className="h-7 flex-1 px-2 text-xs">
                <Phone className="h-3.5 w-3.5" /> Call
              </Button>
            )}
            <Button size="sm" variant="default" className="h-7 flex-1 px-2 text-xs">
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
