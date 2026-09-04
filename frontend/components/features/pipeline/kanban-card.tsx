"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MapPin, GripVertical, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Lead } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn, initials, formatCountryName } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { staggerChild, tapProps, EASE_OUT } from "@/lib/motion";
import { useEffect, useState } from "react";
import { WhatsAppModal } from "@/components/features/pipeline/whatsapp-modal";

const priorityColor = { low: "secondary", medium: "accent", high: "danger" } as const;

export function KanbanCard({ lead, isOverlay }: { lead: Lead; isOverlay?: boolean }) {
  const prefersReduced = useReducedMotion();
  const [justDropped, setJustDropped] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  // dnd-kit draggable setup (skipped for DragOverlay item to prevent duplicate key/node registration)
  const draggable = useDraggable({ id: lead.id, disabled: !!isOverlay });
  
  const style = draggable.transform
    ? { transform: CSS.Translate.toString(draggable.transform), zIndex: 50 }
    : undefined;

  // Settle animation trigger on mount if stage changes (indicating a dropped card)
  useEffect(() => {
    if (isOverlay) return;
    setJustDropped(true);
    const timer = setTimeout(() => setJustDropped(false), 500);
    return () => clearTimeout(timer);
  }, [lead.stage, isOverlay]);

  const cardContent = (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <Link 
          href={`/dashboard/discovery/${lead.id}`} 
          className="min-w-0 text-sm font-semibold hover:text-primary hover:underline transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.name}
        </Link>
        {!isOverlay && (
          <button 
            {...draggable.attributes} 
            {...draggable.listeners} 
            className="shrink-0 cursor-grab touch-none p-1 rounded hover:bg-muted text-muted-foreground active:cursor-grabbing focus-visible:outline-ring"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">{lead.category}</p>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 text-muted-foreground/80" /> 
        <span className="truncate">{lead.city}, {formatCountryName(lead.countryCode)}</span>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <Badge variant={priorityColor[lead.priority]} className="capitalize text-[10px] px-1.5 py-0">
          {lead.priority}
        </Badge>
        {lead.nextFollowUp && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
            <Calendar className="h-3 w-3" /> 
            {new Date(lead.nextFollowUp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground gap-1.5">
        {lead.assignedRep ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[9px] font-semibold shrink-0">
              {initials(lead.assignedRep)}
            </div>
            <span className="truncate max-w-[90px]">{lead.assignedRep}</span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground/60 italic">Unassigned</span>
        )}

        {/* WhatsApp Button */}
        {!isOverlay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsWhatsAppOpen(true);
            }}
            title={`Outreach via WhatsApp to ${lead.name}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/25 hover:border-[#25D366]/50 transition-all border border-[#25D366]/30 shadow-xs cursor-pointer shrink-0 active:scale-95 ml-auto"
          >
            <svg className="h-3 w-3 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.56 0 8.25 3.69 8.25 8.24 0 2.2-.86 4.28-2.42 5.83a8.21 8.21 0 0 1-5.83 2.42c-1.44 0-2.86-.38-4.11-1.11l-.3-.18-3.05.8 1.05-2.97-.2-.31a8.17 8.17 0 0 1-1.25-4.48c0-4.55 3.7-8.24 8.26-8.24m4.53 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.78 2.71 4.3 3.8.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z" />
            </svg>
            <span>WhatsApp</span>
          </button>
        )}
      </div>

      {/* Confetti / celebration elements when card lands in Won */}
      {!isOverlay && lead.stage === "won" && justDropped && !prefersReduced && (
        <div className="absolute inset-0 flex items-center justify-center bg-success/5 pointer-events-none rounded-md overflow-hidden">
          <div className="animate-celebrate text-xl">🎉</div>
          <div className="celebrate-particle bg-primary" style={{ top: "30%", left: "30%" }} />
          <div className="celebrate-particle bg-success" style={{ top: "40%", left: "70%" }} />
          <div className="celebrate-particle bg-accent" style={{ top: "60%", left: "45%" }} />
        </div>
      )}
    </div>
  );

  if (isOverlay) {
    return (
      <div className="rounded-md border border-primary bg-card p-3 shadow-popover relative select-none">
        {cardContent}
      </div>
    );
  }

  return (
    <>
      <motion.div
        ref={draggable.setNodeRef}
        style={style}
        variants={staggerChild}
        animate={justDropped && !prefersReduced ? { scale: [0.96, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        whileHover={draggable.isDragging ? {} : { y: -2, transition: { duration: 0.15 } }}
        className={cn(
          "rounded-md border bg-card p-3 shadow-subtle relative transition-shadow focus-within:ring-1 focus-within:ring-primary/40",
          draggable.isDragging 
            ? "opacity-40 border-primary/40 shadow-none" 
            : "border-border hover:shadow-card"
        )}
      >
        {cardContent}
      </motion.div>

      {!isOverlay && (
        <WhatsAppModal
          lead={lead}
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
        />
      )}
    </>
  );
}
