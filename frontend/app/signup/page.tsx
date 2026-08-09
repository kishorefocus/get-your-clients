"use client";

import Link from "next/link";
import { Globe2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn, staggerContainer, staggerChild, springUI } from "@/lib/motion";
import { useAuth } from "@/lib/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const orgId = useId();
  const emailId = useId();
  const passwordId = useId();

  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("Please fill in all fields. Password must be 8+ characters.");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const orgName = (form.elements.namedItem("org") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const pw = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (!orgName || !email || pw.length < 8) {
      setErrorMsg("Please fill in all fields. Password must be 8+ characters.");
      setState("error");
      return;
    }

    setState("loading");
    try {
      await register({ org_name: orgName, email, password: pw });
      setState("success");
      setTimeout(() => router.push("/dashboard"), 1400);
    } catch (err) {
      let msg = "Something went wrong. Please try again.";
      if (err instanceof ApiError) {
        if (err.status === 409) msg = "An account with that email already exists.";
        else if (err.status === 422) msg = "Please check your details and try again.";
        else if (err.status >= 500) msg = "Server error — please try again shortly.";
        else msg = err.detail;
      }
      setErrorMsg(msg);
      setState("error");
      toast.error(msg);
    }
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
                <p className="font-display text-lg font-semibold">Account created!</p>
                <p className="mt-1 text-sm text-muted-foreground">Setting up your workspace…</p>
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
            <motion.div
              key="form"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
            >
              <motion.div variants={staggerChild}>
                <h1 className="mt-6 font-display text-xl font-semibold">Start your free trial</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  14 days, no card required. Set up your org in a minute.
                </p>
              </motion.div>

              <motion.form
                className="mt-6 space-y-3"
                onSubmit={handleSubmit}
                animate={state === "error" ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
              >
                <motion.div variants={staggerChild}>
                  <label
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                    htmlFor={orgId}
                  >
                    Company name
                  </label>
                  <Input
                    id={orgId}
                    name="org"
                    placeholder="Acme Exports"
                    disabled={state === "loading"}
                    className={state === "error" ? "border-danger/60" : ""}
                  />
                </motion.div>

                <motion.div variants={staggerChild}>
                  <label
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                    htmlFor={emailId}
                  >
                    Work email
                  </label>
                  <Input
                    id={emailId}
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    disabled={state === "loading"}
                    className={state === "error" ? "border-danger/60" : ""}
                  />
                </motion.div>

                <motion.div variants={staggerChild}>
                  <label
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                    htmlFor={passwordId}
                  >
                    Password
                  </label>
                  <Input
                    id={passwordId}
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    disabled={state === "loading"}
                    className={state === "error" ? "border-danger/60" : ""}
                  />
                </motion.div>

                <AnimatePresence>
                  {state === "error" && (
                    <motion.p
                      key="err"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-danger"
                    >
                      {errorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.div variants={staggerChild}>
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={state === "loading"}
                    >
                      {state === "loading" ? "Creating account…" : "Create account"}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.form>

              <motion.p
                variants={staggerChild}
                className="mt-6 text-center text-xs text-muted-foreground"
              >
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Log in
                </Link>
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
