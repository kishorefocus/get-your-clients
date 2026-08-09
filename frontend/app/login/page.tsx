"use client";

import Link from "next/link";
import { Globe2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { scaleIn, fadeUp, staggerContainer, staggerChild, springUI } from "@/lib/motion";

export default function LoginPage() {
  const prefersReduced = useReducedMotion();
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();

  const [state, setState] = useState<"idle" | "error" | "success">("idle");
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const pw = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (!email || !pw || pw.length < 4) {
      setState("error");
      setShakeKey((k) => k + 1); // re-trigger shake animation
      return;
    }

    // Simulate success → redirect
    setState("success");
    setTimeout(() => router.push("/dashboard"), 1400);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        className="relative w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-card"
        variants={scaleIn}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <Globe2 className="h-4 w-4" />
          </motion.div>
          <span className="font-display text-lg font-semibold tracking-tight">GlobalReach</span>
        </Link>

        <AnimatePresence mode="wait">
          {state === "success" ? (
            /* Success state */
            <motion.div
              key="success"
              className="mt-8 flex flex-col items-center gap-4 py-6 text-center"
              variants={scaleIn}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...springUI, delay: 0.05 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10"
              >
                <CheckCircle2 className="h-7 w-7 text-success" />
              </motion.div>
              <div>
                <p className="font-display text-lg font-semibold">Welcome back!</p>
                <p className="mt-1 text-sm text-muted-foreground">Taking you to your dashboard…</p>
              </div>
              <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.3, ease: "linear" }}
                />
              </div>
            </motion.div>
          ) : (
            /* Form state */
            <motion.div
              key="form"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
            >
              <motion.div variants={staggerChild}>
                <h1 className="mt-6 font-display text-xl font-semibold">Log in</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Welcome back — pick up where your team left off.
                </p>
              </motion.div>

              <motion.form
                key={shakeKey}
                className="mt-6 space-y-3"
                onSubmit={handleSubmit}
                animate={
                  state === "error" && !prefersReduced
                    ? { x: [0, -7, 7, -5, 5, -3, 3, 0] }
                    : { x: 0 }
                }
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <motion.div variants={staggerChild}>
                  <label
                    className="mb-1.5 block text-xs font-medium text-muted-foreground transition-colors focus-within:text-primary"
                    htmlFor={emailId}
                  >
                    Work email
                  </label>
                  <Input
                    id={emailId}
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    className={state === "error" ? "border-danger/60 focus-visible:ring-danger/30" : ""}
                  />
                </motion.div>

                <motion.div variants={staggerChild}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      className="text-xs font-medium text-muted-foreground transition-colors focus-within:text-primary"
                      htmlFor={passwordId}
                    >
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot?
                    </Link>
                  </div>
                  <Input
                    id={passwordId}
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className={state === "error" ? "border-danger/60 focus-visible:ring-danger/30" : ""}
                  />
                </motion.div>

                <AnimatePresence>
                  {state === "error" && (
                    <motion.p
                      key="error-msg"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-danger"
                    >
                      Invalid email or password. Please try again.
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.div variants={staggerChild}>
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button type="submit" className="w-full" size="lg">
                      Log in
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.form>

              <motion.div variants={staggerChild}>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button variant="outline" className="mt-3 w-full" size="lg">
                    Continue with Google
                  </Button>
                </motion.div>
              </motion.div>

              <motion.p
                variants={staggerChild}
                className="mt-6 text-center text-xs text-muted-foreground"
              >
                New to GlobalReach?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Create an account
                </Link>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
