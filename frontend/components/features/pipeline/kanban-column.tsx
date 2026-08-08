"use client";

import { useDroppable } from "@dnd-kit/core";
import { Lead, PipelineStage } from "@/types";
import { KanbanCard } from "@/components/features/pipeline/kanban-card";
import { cn } from "@/lib/utils";

const stageMeta: Record<PipelineStage, { label: string; dot: string }> = {
  new: { label: "New", dot: "bg-muted-foreground" },
  contacted: { label: "Contacted", dot: "bg-primary" },
  responded: { label: "Responded", dot: "bg-accent" },
  negotiating: { label: "Negotiating", dot: "bg-accent" },
  won: { label: "Won", dot: "bg-success" },
  lost: { label: "Lost", dot: "bg-danger" },
};

export function KanbanColumn({ stage, leads }: { stage: PipelineStage; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const meta = stageMeta[stage];
  const value = leads.reduce((sum, l) => sum + (l.priority === "high" ? 40 : l.priority === "medium" ? 18 : 6), 0);

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
          {meta.label}
          <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{leads.length}</span>
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">${value}K</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-lg border border-dashed p-2 scrollbar-thin transition-colors",
          isOver ? "border-primary bg-primary/5" : "border-border bg-surface"
        )}
      >
        {leads.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">Drop a lead here</p>
        ) : (
          leads.map((lead) => <KanbanCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}
