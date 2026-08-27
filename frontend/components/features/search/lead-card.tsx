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

  const isLocked = lead.isLocked;

  return (
    <motion.div
      variants={staggerChild}
      onMouseEnter={() => !isLocked && onHover?.(lead.id)}
      onMouseLeave={() => !isLocked && onHover?.(null)}
      onClick={() => {
        if (isLocked) {
          toast.info("This lead is locked. Please upgrade to Pro to unlock contact details!");
          return;
        }
        onSelect?.(lead.id);
      }}
      whileHover={isLocked ? { scale: 1.01 } : { y: -2, transition: { duration: 0.18, ease: EASE_OUT } }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-4 shadow-subtle transition-all duration-200",
        active && !isLocked ? "border-primary ring-1 ring-primary" : "border-border",
        isLocked ? "bg-muted/10 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50" : "hover:shadow-card hover:border-border-hover"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
          isLocked ? "bg-muted-foreground/10 text-muted-foreground/60" : "bg-muted text-muted-foreground"
        )}>
          {isLocked ? "🔒" : initials(lead.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {isLocked ? (
                <span className="text-sm font-semibold text-foreground/80 flex items-center gap-1">
                  {lead.name}
                </span>
              ) : (
                <Link
                  href={`/dashboard/discovery/${lead.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="truncate text-sm font-semibold hover:text-primary hover:underline transition-colors"
                >
                  {lead.name}
                </Link>
              )}
              <p className="text-xs text-muted-foreground">{lead.category}</p>
            </div>
            {!isLocked && (
              <Badge variant={stageColor[lead.stage]} className="shrink-0 capitalize">
                {lead.stage}
              </Badge>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className={cn("flex items-center gap-1", isLocked && "blur-[2.5px] select-none")}>
              <MapPin className="h-3 w-3" /> {lead.city && lead.country ? `${lead.city}, ${lead.country}` : lead.address || "Unknown Location"}
            </span>
            {lead.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-accent text-accent" /> {lead.rating} ({lead.reviewCount})
              </span>
            )}
            {lead.distanceKm != null && <span>{lead.distanceKm} km away</span>}
          </div>

          <div className="mt-2">
            <span className={cn("manifest-chip", isLocked && "opacity-50 select-none")}>
              {isLocked ? "XX.XX · LOCKED" : `${formatCoords(lead.lat, lead.lng)} · ${lead.countryCode}`}
            </span>
          </div>

          {/* Action Row */}
          {isLocked ? (
            <div className="mt-4 pt-2.5 flex items-center justify-between border-t border-border/40">
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                🔒 Pro Feature details are hidden
              </span>
              <Link href="/dashboard/settings" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white gap-1 px-3 shadow-md shadow-primary/10">
                  Upgrade
                </Button>
              </Link>
            </div>
          ) : (
            /* Action row — appears on hover */
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
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block"
                  >
                    <Button size="sm" variant="secondary" className="h-7 px-2 text-xs gap-1">
                      <Phone className="h-3.5 w-3.5" /> Call
                    </Button>
                  </a>
                </motion.div>
              )}

              {lead.phone ? (
                <motion.div {...tapProps}>
                  <a
                    href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block"
                  >
                    <Button size="sm" variant="default" className="h-7 px-2 text-xs gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> Message
                    </Button>
                  </a>
                </motion.div>
              ) : (
                <motion.div {...tapProps}>
                  <Button size="sm" variant="default" className="h-7 px-2 text-xs gap-1" disabled>
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
