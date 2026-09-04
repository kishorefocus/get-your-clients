"use client";

import { useState } from "react";
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/features/pipeline/kanban-column";
import { KanbanCard } from "@/components/features/pipeline/kanban-card";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { PipelineStage, Lead } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { staggerContainer, dragOverlayStyle } from "@/lib/motion";
import { usePipelineBoard, useMoveClient } from "@/lib/hooks/use-pipeline";

const defaultStages: PipelineStage[] = ["new", "contacted", "responded", "negotiating", "won", "lost"];

function clientToLead(c: any, stageName: string): Lead {
  return {
    id: c.id,
    name: c.name,
    category: c.category || "Lead",
    industry: c.category || "Unknown",
    country: c.country || "",
    countryCode: (c.country || "").toUpperCase().slice(0, 2) || "GL",
    city: c.city || "",
    address: "",
    lat: 0,
    lng: 0,
    rating: c.rating,
    phone: c.phone || undefined,
    email: c.email || undefined,
    stage: stageName.toLowerCase() as PipelineStage,
    priority: (c.priority || "medium") as "low" | "medium" | "high",
    nextFollowUp: c.nextFollowUp,
    assignedRep: c.assignedRep,
    tags: []
  };
}

export function KanbanBoard() {
  const storeLeads = useLeadsStore((s) => s.leads);
  const setStoreStage = useLeadsStore((s) => s.setStage);
  
  const { data: board, isLoading } = usePipelineBoard();
  const moveMutation = useMoveClient();
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Flatten leads from dynamic board or fallback to store
  const hasApiData = board && board.length > 0;
  
  const allLeads: Lead[] = hasApiData
    ? board!.flatMap((col) => {
        const stageName = col.stage.name.toLowerCase();
        return col.clients.map((c) => clientToLead(c, stageName));
      })
    : storeLeads;

  const activeLead = activeId ? allLeads.find((l) => l.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    
    const newStage = over.id as PipelineStage;
    const lead = allLeads.find((l) => l.id === active.id);
    if (!lead || lead.stage === newStage) return;

    if (hasApiData) {
      // Find UUID of the target stage
      const targetCol = board.find((col) => col.stage.name.toLowerCase() === newStage);
      if (targetCol) {
        moveMutation.mutate({
          client_id: lead.id,
          stage_id: targetCol.stage.id,
        });
      }
    } else {
      // Fallback local update
      setStoreStage(lead.id, newStage);
    }
    
    if (newStage === "won") {
      toast.success(`🎉 Spectacular! ${lead.name} won!`);
    } else {
      toast.success(`${lead.name} moved to ${newStage}`);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex h-full gap-3 sm:gap-4 overflow-x-auto p-3 sm:p-4 pb-20 md:pb-4 scrollbar-thin"
      >
        {defaultStages.map((stage) => (
          <KanbanColumn 
            key={stage} 
            stage={stage} 
            leads={allLeads.filter((l) => l.stage === stage)} 
          />
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
