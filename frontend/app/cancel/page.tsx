"use client";

import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CancelPage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted p-4">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-danger/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/60 bg-card/60 shadow-xl backdrop-blur-xl">
          <CardContent className="flex flex-col items-center p-8 text-center">
            {/* Cancel icon with animation */}
            <div className="relative mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-danger/10 text-danger"
              >
                <XCircle className="h-10 w-10" />
              </motion.div>
            </div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
            >
              Checkout Cancelled
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-3 text-sm text-muted-foreground"
            >
              Your payment was cancelled and your account has not been charged. If you're ready, you can return and try again.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 w-full"
            >
              <Button
                onClick={() => router.push("/dashboard/settings")}
                variant="outline"
                className="group w-full gap-2 transition-all duration-300 hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Return to Settings
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
