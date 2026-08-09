"use client";

import { useDroppable } from "@dnd-kit/core";
import { Lead, PipelineStage } from "@/types";
import { KanbanCard } from "@/components/features/pipeline/kanban-card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainerFast, fadeUp, fadeIn } from "@/lib/motion";

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
    <motion.div
      variants={fadeUp}
      className="flex h-full w-72 shrink-0 flex-col"
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
          {meta.label}
          <AnimatePresence mode="wait">
            <motion.span
              key={leads.length}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {leads.length}
            </motion.span>
          </AnimatePresence>
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="font-mono text-[11px] text-muted-foreground font-semibold"
          >
            ${value}K
          </motion.span>
        </AnimatePresence>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-lg border border-dashed p-2 scrollbar-thin transition-colors duration-250 relative",
          isOver 
            ? "border-primary bg-primary/5 shadow-inner" 
            : "border-border bg-surface"
        )}
      >
        {/* Active drop zone glow background */}
        {isOver && (
          <motion.div
            layoutId={`glow-${stage}`}
            className="absolute inset-0 border border-primary/40 rounded-lg pointer-events-none animate-glow-pulse"
          />
        )}

        <AnimatePresence mode="popLayout">
          {leads.length === 0 ? (
            <motion.div
              key="empty"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center justify-center p-8 border border-dashed border-border/60 rounded-md bg-card/25"
            >
              <span className="manifest-chip mb-2">EMPTY CHANNEL</span>
              <p className="text-center text-[11px] text-muted-foreground">Drop a lead here</p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={staggerContainerFast}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2"
            >
              {leads.map((lead) => (
                <KanbanCard key={lead.id} lead={lead} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
