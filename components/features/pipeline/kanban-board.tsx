"use client";

import { useState } from "react";
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/features/pipeline/kanban-column";
import { KanbanCard } from "@/components/features/pipeline/kanban-card";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { PipelineStage } from "@/types";
import { toast } from "sonner";

const stages: PipelineStage[] = ["new", "contacted", "responded", "negotiating", "won", "lost"];

export function KanbanBoard() {
  const leads = useLeadsStore((s) => s.leads);
  const setStage = useLeadsStore((s) => s.setStage);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStage = over.id as PipelineStage;
    const lead = leads.find((l) => l.id === active.id);
    if (!lead || lead.stage === newStage) return;
    setStage(lead.id, newStage);
    toast.success(`${lead.name} moved to ${newStage}`);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto p-4 scrollbar-thin">
        {stages.map((stage) => (
          <KanbanColumn key={stage} stage={stage} leads={leads.filter((l) => l.stage === stage)} />
        ))}
      </div>

      <DragOverlay>{activeLead ? <div className="w-72"><KanbanCard lead={activeLead} /></div> : null}</DragOverlay>
    </DndContext>
  );
}
