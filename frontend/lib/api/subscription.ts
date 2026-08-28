import { apiFetch } from "./client";

export interface SubscriptionResponse {
  id: string;
  org_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  checkout_url?: string;
  billing_interval?: string;
}


export async function getSubscriptionStatus(): Promise<SubscriptionResponse> {
  return apiFetch<SubscriptionResponse>("/api/v1/subscriptions/status");
}

export async function subscribeToPlan(plan: string, interval: "month" | "year" = "month"): Promise<SubscriptionResponse> {
  return apiFetch<SubscriptionResponse>("/api/v1/subscriptions/subscribe", {
    method: "POST",
    body: { plan, interval },
  });
}

export async function cancelSubscription(): Promise<SubscriptionResponse> {
  return apiFetch<SubscriptionResponse>("/api/v1/subscriptions/cancel", {
    method: "POST",
  });
}

export async function confirmPayment(sessionId: string): Promise<{ status: string; plan: string }> {
  return apiFetch<{ status: string; plan: string }>(`/api/v1/subscriptions/confirm-payment?session_id=${sessionId}`, {
    method: "POST",
  });
}

