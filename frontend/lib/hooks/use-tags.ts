import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTags,
  createTag,
  deleteTag,
  attachTag,
  detachTag,
  TagCreateRequest,
} from "@/lib/api/tags";
import { CLIENT_KEYS } from "./use-clients";
import { toast } from "sonner";

export const TAG_KEYS = {
  all: ["tags"] as const,
  list: ["tags", "list"] as const,
};

export function useTags() {
  return useQuery({
    queryKey: TAG_KEYS.list,
    queryFn: listTags,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAG_KEYS.list });
      toast.success("Tag created");
    },
    onError: (err: Error) => toast.error(`Create failed: ${err.message}`),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAG_KEYS.all });
      toast.success("Tag deleted");
    },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });
}

export function useAttachTag(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => attachTag(clientId, tagId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.detail(clientId) });
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.all });
      toast.success("Tag attached");
    },
    onError: (err: Error) => toast.error(`Attach failed: ${err.message}`),
  });
}

export function useDetachTag(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => detachTag(clientId, tagId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.detail(clientId) });
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.all });
      toast.success("Tag detached");
    },
    onError: (err: Error) => toast.error(`Detach failed: ${err.message}`),
  });
}
