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

import { useState } from "react";
import Link from "next/link";
import { Lead } from "@/types";
import { cn, formatCoords, initials } from "@/lib/utils";
import { Star, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(
  () => import("./interactive-map").then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-[hsl(224,33%,7%)] animate-pulse">
        <span className="text-xs text-muted-foreground/75 font-mono tracking-wider">INITIATING MAP ENGINE...</span>
      </div>
    ),
  }
);

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

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <InteractiveMap
        leads={leads}
        activeId={activeId}
        onHover={onHover}
        onSelect={onSelect}
        onMarkerClick={setSelected}
      />

      <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-white/70 backdrop-blur z-[500]">
        {leads.length} pins plotted
      </div>

      {selected && (
        <div className="absolute bottom-4 left-4 w-72 animate-fade-up rounded-lg border border-border bg-card p-4 shadow-popover z-[500]">
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
            {selected.phone ? (
              <>
                <a
                  href={`tel:${selected.phone}`}
                  className="flex-1"
                >
                  <Button size="sm" variant="secondary" className="h-7 w-full px-2 text-xs gap-1">
                    <Phone className="h-3.5 w-3.5" /> Call
                  </Button>
                </a>
                <a
                  href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button size="sm" variant="default" className="h-7 w-full px-2 text-xs gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </Button>
                </a>
              </>
            ) : (
              <Button size="sm" variant="default" className="h-7 flex-1 px-2 text-xs gap-1" disabled>
                <MessageSquare className="h-3.5 w-3.5" /> Message
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
