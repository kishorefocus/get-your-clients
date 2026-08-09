import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchClients,
  getClient,
  updateClient,
  ClientSearchRequest,
  ClientUpdateRequest,
} from "@/lib/api/clients";
import { moveClient } from "@/lib/api/pipeline";
import { toast } from "sonner";

export const CLIENT_KEYS = {
  all: ["clients"] as const,
  search: (params: ClientSearchRequest) => ["clients", "search", params] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
};

/** Search/list clients. Falls back silently to empty on API error. */
export function useClients(params: ClientSearchRequest = {}) {
  return useQuery({
    queryKey: CLIENT_KEYS.search(params),
    queryFn: () => searchClients(params),
    staleTime: 30_000,
  });
}

/** Fetch a single client by ID. */
export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: CLIENT_KEYS.detail(id ?? ""),
    queryFn: () => getClient(id!),
    enabled: !!id,
  });
}

/** Update client fields (PATCH). */
export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClientUpdateRequest }) =>
      updateClient(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.all });
      qc.setQueryData(CLIENT_KEYS.detail(data.id), data);
      toast.success("Client updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Move a client to a different pipeline stage (optimistic). */
export function useMoveClientStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: moveClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline"] });
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.all });
    },
    onError: (err: Error) => toast.error(`Move failed: ${err.message}`),
  });
}
