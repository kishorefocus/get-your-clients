import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  SavedSearchCreateRequest,
  SavedSearchUpdateRequest,
} from "@/lib/api/saved-searches";
import { toast } from "sonner";

export const SAVED_SEARCH_KEYS = {
  all: ["saved-searches"] as const,
  list: ["saved-searches", "list"] as const,
};

export function useSavedSearches() {
  return useQuery({
    queryKey: SAVED_SEARCH_KEYS.list,
    queryFn: listSavedSearches,
  });
}

export function useCreateSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSavedSearch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SAVED_SEARCH_KEYS.list });
      toast.success("Search filters saved");
    },
    onError: (err: Error) => toast.error(`Save failed: ${err.message}`),
  });
}

export function useUpdateSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SavedSearchUpdateRequest }) =>
      updateSavedSearch(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SAVED_SEARCH_KEYS.list });
      toast.success("Saved search updated");
    },
    onError: (err: Error) => toast.error(`Update failed: ${err.message}`),
  });
}

export function useDeleteSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SAVED_SEARCH_KEYS.list });
      toast.success("Saved search deleted");
    },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });
}
