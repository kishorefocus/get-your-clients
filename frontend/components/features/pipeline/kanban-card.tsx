"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MapPin, GripVertical, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Lead } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { staggerChild, tapProps, EASE_OUT } from "@/lib/motion";
import { useEffect, useState } from "react";

const priorityColor = { low: "secondary", medium: "accent", high: "danger" } as const;

export function KanbanCard({ lead, isOverlay }: { lead: Lead; isOverlay?: boolean }) {
  const prefersReduced = useReducedMotion();
  const [justDropped, setJustDropped] = useState(false);

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
        <span className="truncate">{lead.city}, {lead.countryCode}</span>
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

      {lead.assignedRep && (
        <div className="flex items-center gap-1.5 border-t border-border/60 pt-2 text-xs text-muted-foreground">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[9px] font-semibold">
            {initials(lead.assignedRep)}
          </div>
          <span className="truncate">{lead.assignedRep}</span>
        </div>
      )}

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
  );
}
