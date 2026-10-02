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

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  plan: string;
  interval: string;
  key_id?: string;
  mode?: string; // "mock" in dev
}

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan: string;
  interval: string;
}

export async function getSubscriptionStatus(): Promise<SubscriptionResponse> {
  return apiFetch<SubscriptionResponse>("/api/v1/subscriptions/status");
}

export async function subscribeToPlan(
  plan: string,
  interval: "month" | "year" = "month"
): Promise<SubscriptionResponse> {
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

/**
 * Step 1: Ask the backend to create a server-signed Razorpay Order.
 * @param amountInRupees - Amount in INR (will be converted to paise server-side)
 */
export async function createRazorpayOrder(
  amountInRupees: number,
  plan: string,
  interval: "month" | "year"
): Promise<RazorpayOrderResponse> {
  return apiFetch<RazorpayOrderResponse>("/api/v1/subscriptions/razorpay/create-order", {
    method: "POST",
    body: {
      amount: amountInRupees * 100, // convert to paise
      currency: "INR",
      plan,
      interval,
    },
  });
}

/**
 * Step 2: Verify the Razorpay payment signature server-side and activate the subscription.
 */
export async function verifyRazorpayPayment(
  payload: RazorpayVerifyPayload
): Promise<{ success: boolean; plan: string }> {
  return apiFetch<{ success: boolean; plan: string }>(
    "/api/v1/subscriptions/razorpay/verify-payment",
    {
      method: "POST",
      body: payload,
    }
  );
}
