"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MapPin, GripVertical } from "lucide-react";
import Link from "next/link";
import { Lead } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";

const priorityColor = { low: "secondary", medium: "accent", high: "danger" } as const;

export function KanbanCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-md border border-border bg-card p-3 shadow-subtle transition-shadow",
        isDragging ? "opacity-50 shadow-popover" : "hover:shadow-card"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/dashboard/discovery/${lead.id}`} className="min-w-0 text-sm font-medium hover:text-primary hover:underline">
          {lead.name}
        </Link>
        <button {...attributes} {...listeners} className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mt-0.5 text-xs text-muted-foreground">{lead.category}</p>

      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" /> {lead.city}, {lead.countryCode}
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <Badge variant={priorityColor[lead.priority]} className="capitalize">{lead.priority}</Badge>
        {lead.nextFollowUp && (
          <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" /> {new Date(lead.nextFollowUp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {lead.assignedRep && (
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2 text-xs text-muted-foreground">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold">
            {initials(lead.assignedRep)}
          </div>
          {lead.assignedRep}
        </div>
      )}
    </div>
  );
}
