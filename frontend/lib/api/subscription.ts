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

export async function confirmPayment(transactionId: string, plan?: string): Promise<{ status: string; plan: string }> {
  const url = plan 
    ? `/api/v1/subscriptions/confirm-payment?transaction_id=${transactionId}&plan=${plan}`
    : `/api/v1/subscriptions/confirm-payment?transaction_id=${transactionId}`;
  return apiFetch<{ status: string; plan: string }>(url, {
    method: "POST",
  });
}


