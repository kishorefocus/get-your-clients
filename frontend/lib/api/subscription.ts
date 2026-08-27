import { apiFetch } from "./client";

export interface SubscriptionResponse {
  id: string;
  org_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
}

export async function getSubscriptionStatus(): Promise<SubscriptionResponse> {
  return apiFetch<SubscriptionResponse>("/api/v1/subscriptions/status");
}

export async function subscribeToPlan(plan: string): Promise<SubscriptionResponse> {
  return apiFetch<SubscriptionResponse>("/api/v1/subscriptions/subscribe", {
    method: "POST",
    body: { plan },
  });
}

export async function cancelSubscription(): Promise<SubscriptionResponse> {
  return apiFetch<SubscriptionResponse>("/api/v1/subscriptions/cancel", {
    method: "POST",
  });
}
