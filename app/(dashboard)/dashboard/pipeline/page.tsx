import { Topbar } from "@/components/features/layout/topbar";
import { KanbanBoard } from "@/components/features/pipeline/kanban-board";

export default function PipelinePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Pipeline" />
      <div className="min-h-0 flex-1">
        <KanbanBoard />
      </div>
    </div>
  );
}
