import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listStages, getBoard, moveClient, MoveClientStageRequest } from "@/lib/api/pipeline";
import { toast } from "sonner";

export const PIPELINE_KEYS = {
  stages: ["pipeline", "stages"] as const,
  board: ["pipeline", "board"] as const,
};

/** Fetch all pipeline stages for this org. */
export function usePipelineStages() {
  return useQuery({
    queryKey: PIPELINE_KEYS.stages,
    queryFn: listStages,
    staleTime: 60_000,
  });
}

/** Fetch the full kanban board (stages + clients grouped). */
export function usePipelineBoard() {
  return useQuery({
    queryKey: PIPELINE_KEYS.board,
    queryFn: getBoard,
    staleTime: 30_000,
  });
}

/** Move a client to a different pipeline stage. */
export function useMoveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MoveClientStageRequest) => moveClient(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PIPELINE_KEYS.board });
    },
    onError: (err: Error) => toast.error(`Could not move card: ${err.message}`),
  });
}
