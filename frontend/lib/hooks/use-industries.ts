import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listIndustries,
  getIndustryTree,
  createIndustry,
  deleteIndustry,
  IndustryCreateRequest,
} from "@/lib/api/industries";
import { toast } from "sonner";

export const INDUSTRY_KEYS = {
  all: ["industries"] as const,
  list: (parentId?: string) => ["industries", "list", parentId ?? ""] as const,
  tree: ["industries", "tree"] as const,
};

export function useIndustries(parentId?: string) {
  return useQuery({
    queryKey: INDUSTRY_KEYS.list(parentId),
    queryFn: () => listIndustries(parentId),
  });
}

export function useIndustryTree() {
  return useQuery({
    queryKey: INDUSTRY_KEYS.tree,
    queryFn: getIndustryTree,
  });
}

export function useCreateIndustry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createIndustry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INDUSTRY_KEYS.all });
      toast.success("Industry created");
    },
    onError: (err: Error) => toast.error(`Create failed: ${err.message}`),
  });
}

export function useDeleteIndustry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteIndustry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INDUSTRY_KEYS.all });
      toast.success("Industry deleted");
    },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });
}
