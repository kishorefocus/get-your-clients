"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Lead } from "@/types";
import { useTheme } from "@/lib/hooks/use-theme";
import { renderToString } from "react-dom/server";
import {
  Factory,
  Cpu,
  Truck,
  Utensils,
  HeartPulse,
  Briefcase,
  ShoppingBag,
  Building2,
} from "lucide-react";

function getIndustryIcon(industry: string, category: string) {
  const ind = (industry || "").toLowerCase();
  const cat = (category || "").toLowerCase();

  if (ind.includes("manufactur") || cat.includes("manufactur")) return Factory;
  if (
    ind.includes("tech") ||
    ind.includes("software") ||
    cat.includes("robot") ||
    cat.includes("software") ||
    cat.includes("electronics")
  )
    return Cpu;
  if (
    ind.includes("logist") ||
    ind.includes("transport") ||
    cat.includes("freight") ||
    cat.includes("logist") ||
    ind.includes("shipping") ||
    cat.includes("maritime") ||
    cat.includes("shipping")
  )
    return Truck;
  if (ind.includes("food") || ind.includes("beverage") || cat.includes("food") || cat.includes("restaurant"))
    return Utensils;
  if (ind.includes("health") || ind.includes("med") || cat.includes("medical") || cat.includes("hospital"))
    return HeartPulse;
  if (ind.includes("finance") || ind.includes("bank") || cat.includes("finance") || ind.includes("consult"))
    return Briefcase;
  if (ind.includes("retail") || ind.includes("commerce") || cat.includes("shop") || cat.includes("distributor"))
    return ShoppingBag;

  return Building2;
}

interface InteractiveMapProps {
  leads: Lead[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  onMarkerClick?: (lead: Lead) => void;
}

export function InteractiveMap({
  leads,
  activeId,
  onHover,
  onSelect,
  onMarkerClick,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { theme } = useTheme();

  const [browserLocation, setBrowserLocation] = useState<L.LatLngTuple | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const browserMarkerRef = useRef<L.Marker | null>(null);

  // Get user geolocation and center/zoom map
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setBrowserLocation([latitude, longitude]);
      },
      (error) => {
        console.error("Error fetching browser location:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Handle current location marker and initial map view centering
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !browserLocation) return;

    const [lat, lng] = browserLocation;

    const pulsingIcon = L.divIcon({
      className: "custom-browser-location-icon",
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-25 animate-ping"></div>
          <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (browserMarkerRef.current) {
      browserMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { icon: pulsingIcon });
      marker.bindPopup("Your Location").addTo(map);
      browserMarkerRef.current = marker;
    }

    if (!hasCentered) {
      map.setView([lat, lng], 13, { animate: true, duration: 0.8 });
      setHasCentered(true);
    }
  }, [browserLocation, hasCentered]);

  // Filter valid leads
  const validLeads = useMemo(() => {
    return leads.filter(
      (l) =>
        typeof l.lat === "number" &&
        typeof l.lng === "number" &&
        !isNaN(l.lat) &&
        !isNaN(l.lng)
    );
  }, [leads]);

  // Unique hash for valid leads to avoid unnecessary fitBounds calls
  const leadsHash = useMemo(() => {
    return validLeads.map((l) => `${l.id}-${l.lat}-${l.lng}`).join(",");
  }, [validLeads]);

  // 1. Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Use a default global center (USA center) if no leads are present initially
    const initialCenter: L.LatLngExpression = [37.0902, -95.7129];
    const initialZoom = 4;

    const map = L.map(containerRef.current, {
      zoomControl: false, // We'll add it in the top-right corner
      attributionControl: true,
      maxZoom: 18,
      minZoom: 2,
    }).setView(initialCenter, initialZoom);

    mapRef.current = map;

    // Add zoom control at top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Call invalidateSize on container resize using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    // Fire immediately and also with a small delay to handle initial layout and animations
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Handle tile layer updates on theme change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution = `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`;

    const layer = L.tileLayer(tileUrl, {
      attribution,
      className: theme === "dark" ? "map-dark-tiles" : "",
    });
    layer.addTo(map);
    tileLayerRef.current = layer;
  }, [theme]);

  // Helper to create HTML icons matching GlobalReach's design system with category icons
  const createIcon = (lead: Lead, isActive: boolean) => {
    const IconComponent = getIndustryIcon(lead.industry, lead.category);
    // Add explicit className width/height so global resets don't collapse the SVG to 0 width/height
    const iconSvgString = renderToString(
      <IconComponent
        className={isActive ? "w-[16px] h-[16px]" : "w-[14px] h-[14px]"}
        strokeWidth={2.2}
      />
    );

    const activeHtml = `
      <div class="relative flex items-center justify-center w-full h-full">
        <div class="absolute w-10 h-10 rounded-full bg-[hsl(228,100%,57%)] opacity-25 animate-ping"></div>
        <div class="w-9 h-9 rounded-full bg-card border-2 border-[hsl(37,90%,60%)] shadow-xl flex items-center justify-center text-[hsl(37,90%,60%)] transition-all duration-300">
          ${iconSvgString}
        </div>
      </div>
    `;
    const inactiveHtml = `
      <div class="relative flex items-center justify-center w-full h-full group">
        <div class="w-8 h-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground group-hover:border-[hsl(228,100%,64%)] group-hover:text-[hsl(228,100%,64%)] transition-all duration-150">
          ${iconSvgString}
        </div>
      </div>
    `;

    return L.divIcon({
      className: "custom-div-icon",
      html: isActive ? activeHtml : inactiveHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  // 3. Manage marker addition and removal lifecycle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Track active lead IDs to identify ones to remove
    const activeLeadIds = new Set(validLeads.map((l) => l.id));

    // Remove obsolete markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!activeLeadIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    validLeads.forEach((lead) => {
      const isSelected = activeId === lead.id;
      const existingMarker = markersRef.current[lead.id];

      if (existingMarker) {
        existingMarker.setLatLng([lead.lat, lead.lng]);
        existingMarker.setIcon(createIcon(lead, isSelected));
      } else {
        const marker = L.marker([lead.lat, lead.lng], {
          icon: createIcon(lead, isSelected),
        });

        marker.on("mouseover", () => {
          onHover?.(lead.id);
        });

        marker.on("mouseout", () => {
          onHover?.(null);
        });

        marker.on("click", () => {
          onSelect?.(lead.id);
          onMarkerClick?.(lead);
        });

        marker.addTo(map);
        markersRef.current[lead.id] = marker;
      }
    });
  }, [validLeads, onHover, onSelect, onMarkerClick]);

  // 4. Update marker icons and z-index on activeId changes
  useEffect(() => {
    validLeads.forEach((lead) => {
      const marker = markersRef.current[lead.id];
      if (marker) {
        const isSelected = activeId === lead.id;
        marker.setIcon(createIcon(lead, isSelected));
        if (isSelected) {
          marker.setZIndexOffset(1000);
        } else {
          marker.setZIndexOffset(0);
        }
      }
    });
  }, [activeId, validLeads]);

  // 5. Fit bounds to contain all leads when leads change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || validLeads.length === 0) return;

    // Skip fitting bounds to leads if we are focusing on the browser location
    if (browserLocation) return;

    map.invalidateSize();
    const bounds = L.latLngBounds(validLeads.map((l) => [l.lat, l.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }, [leadsHash, validLeads, browserLocation]);

  // 6. Smoothly pan to the active lead position when activeId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeId) return;

    const activeLead = validLeads.find((l) => l.id === activeId);
    if (activeLead) {
      map.invalidateSize();
      map.setView([activeLead.lat, activeLead.lng], Math.max(map.getZoom(), 12), {
        animate: true,
        duration: 0.5,
      });
    }
  }, [activeId, validLeads]);

  return <div ref={containerRef} className="h-full w-full z-0" />;
}
