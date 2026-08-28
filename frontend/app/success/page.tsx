"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { SUB_KEYS } from "@/lib/hooks/use-subscription";
import { ORG_KEYS } from "@/lib/hooks/use-org";
import { confirmPayment } from "@/lib/api/subscription";

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [status, setStatus] = useState<"confirming" | "success" | "error">("confirming");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const qc = useQueryClient();

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMessage("Missing Stripe checkout session ID.");
      return;
    }
    const activeSessionId = sessionId as string;

    let isMounted = true;

    async function verify() {
      try {
        await confirmPayment(activeSessionId);
        
        if (isMounted) {
          setStatus("success");
          // Invalidate cache immediately so settings page gets fresh plan info
          qc.invalidateQueries({ queryKey: SUB_KEYS.status });
          qc.invalidateQueries({ queryKey: ORG_KEYS.me });
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err.message || "Failed to confirm subscription payment.");
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [sessionId, qc]);

  // Countdown timer for redirection on success
  useEffect(() => {
    if (status !== "success") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard/settings");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, router]);

  return (
    <Card className="border-border/60 bg-card/60 shadow-xl backdrop-blur-xl">
      <CardContent className="flex flex-col items-center p-8 text-center">
        {status === "confirming" && (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground">Confirming Payment...</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we secure your subscription with Stripe.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Verification Failed</h1>
            <p className="mt-2 text-sm text-danger max-w-xs">{errorMessage}</p>
            <Button
              onClick={() => router.push("/dashboard/settings")}
              className="mt-6"
              variant="outline"
            >
              Go to Settings
            </Button>
          </div>
        )}

        {status === "success" && (
          <>
            {/* Success icon with animation */}
            <div className="relative mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"
              >
                <CheckCircle2 className="h-10 w-10" />
              </motion.div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1 -right-1 text-amber-500"
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>
            </div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
            >
              Payment Successful!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-muted-foreground"
            >
              Thank you for upgrading! Your subscription status has been updated. You now have full access to your plan's premium features.
            </motion.p>

            {/* Countdown animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex items-center justify-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Redirecting to billing in <span className="font-mono font-bold text-foreground">{countdown}s</span>...
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 w-full"
            >
              <Button
                onClick={() => router.push("/dashboard/settings")}
                className="group w-full gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function SuccessPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted p-4">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-md"
      >
        <Suspense fallback={
          <Card className="border-border/60 bg-card/60 shadow-xl backdrop-blur-xl">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </CardContent>
          </Card>
        }>
          <SuccessPageContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
