"use client";

import Link from "next/link";
import { Star, MapPin, Phone, MessageSquare, Bookmark, Plus } from "lucide-react";
import { Lead } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCoords, initials } from "@/lib/utils";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { motion } from "framer-motion";
import { staggerChild, tapProps, EASE_OUT } from "@/lib/motion";
import { toast } from "sonner";

const stageColor: Record<Lead["stage"], "default" | "secondary" | "success" | "danger" | "accent"> = {
  new: "secondary",
  contacted: "default",
  responded: "accent",
  negotiating: "accent",
  won: "success",
  lost: "danger",
};

export function LeadCard({
  lead,
  active,
  onHover,
  onSelect,
}: {
  lead: Lead;
  active?: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}) {
  const toggleSaved = useLeadsStore((s) => s.toggleSaved);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaved(lead.id);
    toast.success(lead.savedByMe ? "Removed from saved" : "Lead saved to your list");
  };

  return (
    <motion.div
      variants={staggerChild}
      onMouseEnter={() => onHover?.(lead.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onSelect?.(lead.id)}
      whileHover={{ y: -2, transition: { duration: 0.18, ease: EASE_OUT } }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-4 shadow-subtle transition-shadow hover:shadow-card",
        active ? "border-primary ring-1 ring-primary" : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
          {initials(lead.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/dashboard/discovery/${lead.id}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate text-sm font-semibold hover:text-primary hover:underline transition-colors"
              >
                {lead.name}
              </Link>
              <p className="text-xs text-muted-foreground">{lead.category}</p>
            </div>
            <Badge variant={stageColor[lead.stage]} className="shrink-0 capitalize">
              {lead.stage}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {lead.city}, {lead.country}
            </span>
            {lead.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-accent text-accent" /> {lead.rating} ({lead.reviewCount})
              </span>
            )}
            {lead.distanceKm != null && <span>{lead.distanceKm} km away</span>}
          </div>

          <div className="mt-2">
            <span className="manifest-chip">
              {formatCoords(lead.lat, lead.lng)} · {lead.countryCode}
            </span>
          </div>

          {/* Action row — appears on hover */}
          <div className="mt-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
            <motion.div {...tapProps}>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-xs gap-1"
                onClick={handleSave}
              >
                <motion.div
                  animate={lead.savedByMe ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <Bookmark
                    className={cn(
                      "h-3.5 w-3.5 transition-colors duration-200",
                      lead.savedByMe ? "fill-primary text-primary" : ""
                    )}
                  />
                </motion.div>
                {lead.savedByMe ? "Saved" : "Save"}
              </Button>
            </motion.div>

            <motion.div {...tapProps}>
              <Button size="sm" variant="secondary" className="h-7 px-2 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Pipeline
              </Button>
            </motion.div>

            {lead.phone && (
              <motion.div {...tapProps}>
                <Button size="sm" variant="secondary" className="h-7 px-2 text-xs gap-1">
                  <Phone className="h-3.5 w-3.5" /> Call
                </Button>
              </motion.div>
            )}

            <motion.div {...tapProps}>
              <Button size="sm" variant="default" className="h-7 px-2 text-xs gap-1">
                <MessageSquare className="h-3.5 w-3.5" /> Message
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
