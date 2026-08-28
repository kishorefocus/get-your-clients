import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubscriptionStatus,
  subscribeToPlan,
  cancelSubscription,
} from "@/lib/api/subscription";
import { ORG_KEYS } from "./use-org";
import { toast } from "sonner";

export const SUB_KEYS = {
  status: ["subscription", "status"] as const,
};

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: SUB_KEYS.status,
    queryFn: getSubscriptionStatus,
    staleTime: 60_000,
  });
}

export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: string) => subscribeToPlan(plan),
    onSuccess: (newSub) => {
      qc.invalidateQueries({ queryKey: SUB_KEYS.status });
      qc.invalidateQueries({ queryKey: ORG_KEYS.me });
      if (newSub.checkout_url) {
        window.location.href = newSub.checkout_url;
      } else {
        toast.success(`Successfully upgraded to ${newSub.plan} plan!`);
      }
    },

    onError: (err: Error) => {
      toast.error(err.message || "Failed to upgrade subscription");
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUB_KEYS.status });
      qc.invalidateQueries({ queryKey: ORG_KEYS.me });
      toast.success("Subscription cancelled successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel subscription");
    },
  });
}
