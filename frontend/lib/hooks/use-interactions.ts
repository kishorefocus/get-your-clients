import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listInteractions,
  createInteraction,
  InteractionCreateRequest,
} from "@/lib/api/interactions";
import { toast } from "sonner";

export const INTERACTION_KEYS = {
  all: ["interactions"] as const,
  list: (clientId: string, cursor?: string, limit?: number) =>
    ["interactions", "list", clientId, cursor ?? "", limit ?? 25] as const,
};

export function useInteractions(clientId: string, cursor?: string, limit?: number) {
  return useQuery({
    queryKey: INTERACTION_KEYS.list(clientId, cursor, limit),
    queryFn: () => listInteractions(clientId, cursor, limit),
    enabled: !!clientId,
  });
}

export function useCreateInteraction(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InteractionCreateRequest) => createInteraction(clientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INTERACTION_KEYS.list(clientId) });
      toast.success("Activity logged");
    },
    onError: (err: Error) => toast.error(`Logging failed: ${err.message}`),
  });
}
