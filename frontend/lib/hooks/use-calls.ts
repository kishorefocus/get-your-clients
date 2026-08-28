import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCalls, createCall, CallCreateRequest } from "@/lib/api/calls";
import { toast } from "sonner";

export const CALLS_KEYS = {
  all: ["calls"] as const,
};

export function useCalls() {
  return useQuery({
    queryKey: CALLS_KEYS.all,
    queryFn: listCalls,
    staleTime: 15_000,
  });
}

export function useCreateCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CallCreateRequest) => createCall(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CALLS_KEYS.all });
      toast.success("Call logged successfully");
    },
    onError: (err: Error) => {
      toast.error(`Failed to log call: ${err.message}`);
    },
  });
}
