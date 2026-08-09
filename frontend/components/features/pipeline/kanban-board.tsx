"use client";

import { useState } from "react";
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/features/pipeline/kanban-column";
import { KanbanCard } from "@/components/features/pipeline/kanban-card";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { PipelineStage } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { staggerContainer, dragOverlayStyle } from "@/lib/motion";

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
    
    if (newStage === "won") {
      toast.success(`🎉 Spectacular! ${lead.name} won!`);
    } else {
      toast.success(`${lead.name} moved to ${newStage}`);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex h-full gap-4 overflow-x-auto p-4 scrollbar-thin"
      >
        {stages.map((stage) => (
          <KanbanColumn key={stage} stage={stage} leads={leads.filter((l) => l.stage === stage)} />
        ))}
      </motion.div>

      <DragOverlay dropAnimation={null}>
        {activeLead ? (
          <motion.div 
            style={dragOverlayStyle}
            className="w-72 cursor-grabbing pointer-events-none"
          >
            <KanbanCard lead={activeLead} isOverlay />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
