"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api/subscription";
import { useQueryClient } from "@tanstack/react-query";
import { SUB_KEYS } from "@/lib/hooks/use-subscription";
import { ORG_KEYS } from "@/lib/hooks/use-org";

// ────────────────────────────────────────────────────────────────────────────
// Plan prices in INR (₹)
// ────────────────────────────────────────────────────────────────────────────
export const RAZORPAY_PLAN_PRICES: Record<string, { month: number; year: number }> = {
  growth: { month: 1900, year: 1500 },   // ₹1,900/mo  |  ₹1,500/mo billed annually
  pro: { month: 4900, year: 3900 },
  enterprise: { month: 14900, year: 11900 },
};

// ────────────────────────────────────────────────────────────────────────────
// Type augmentations for window.Razorpay
// ────────────────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: any;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Script loader helper
// ────────────────────────────────────────────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (document.getElementById("razorpay-checkout-js")) return resolve(true);

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────────────
interface RazorpayButtonProps {
  plan: string;
  interval: "month" | "year";
  amountInRupees: number;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  /** Called after a successful payment is verified by the backend */
  onSuccess?: (plan: string) => void;
  /** Called when the checkout is dismissed without payment */
  onDismiss?: () => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────
export function RazorpayButton({
  plan,
  interval,
  amountInRupees,
  userEmail,
  userName,
  userPhone,
  onSuccess,
  onDismiss,
  className,
  children,
  disabled = false,
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const handlePayment = useCallback(async () => {
    if (loading || disabled) return;
    setLoading(true);

    try {
      // 1. Load Razorpay checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Razorpay SDK failed to load. Check your internet connection.");
        return;
      }

      // 2. Create a server-signed Razorpay Order
      const order = await createRazorpayOrder(amountInRupees, plan, interval);

      // Dev mock – skip actual checkout overlay
      if (order.mode === "mock") {
        const result = await verifyRazorpayPayment({
          razorpay_order_id: order.id,
          razorpay_payment_id: "pay_mock_development",
          razorpay_signature: "mock_signature",
          plan,
          interval,
        });
        if (result.success) {
          qc.invalidateQueries({ queryKey: SUB_KEYS.status });
          qc.invalidateQueries({ queryKey: ORG_KEYS.me });
          toast.success(`🎉 Upgraded to ${result.plan} plan! (dev mock)`);
          onSuccess?.(result.plan);
        }
        return;
      }

      // 3. Open Razorpay checkout modal
      const options = {
        key: order.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,       // in paise – already converted by the backend
        currency: order.currency,
        name: "GetYourClients",
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan – ${interval === "year" ? "Annual" : "Monthly"}`,
        image: "/icon.png",
        order_id: order.id,

        prefill: {
          name: userName || "",
          email: userEmail || "",
          contact: userPhone || "",
        },

        theme: {
          color: "#6366f1", // matches the app's primary indigo
          backdrop_color: "rgba(0,0,0,0.6)",
        },

        modal: {
          ondismiss: () => {
            toast.info("Checkout was closed.");
            onDismiss?.();
          },
        },

        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 4. Verify signature server-side and activate subscription
            const result = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan,
              interval,
            });

            if (result.success) {
              qc.invalidateQueries({ queryKey: SUB_KEYS.status });
              qc.invalidateQueries({ queryKey: ORG_KEYS.me });
              toast.success(`🎉 You're now on the ${result.plan} plan!`);
              onSuccess?.(result.plan);
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch (err: any) {
            toast.error(err?.message || "Failed to verify payment. Please contact support.");
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (failureResponse: any) => {
        toast.error(
          failureResponse?.error?.description ||
            "Payment failed. Please try again or use a different payment method."
        );
      });

      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || "Failed to initiate checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, disabled, amountInRupees, plan, interval, userEmail, userName, userPhone, onSuccess, onDismiss, qc]);

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading || disabled}
      className={className}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin inline-block mr-1.5" /> : null}
      {children}
    </button>
  );
}
