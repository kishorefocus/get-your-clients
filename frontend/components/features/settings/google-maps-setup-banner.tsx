"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Sparkles, CheckCircle2, ArrowRight, X, ExternalLink, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleAuth } from "@/lib/hooks/use-google-auth";
import { getGoogleMapsStatus, autoConnectGoogleMaps, saveGoogleMapsKey } from "@/lib/api/orgs";
import { toast } from "sonner";
import { GoogleLogo } from "@/components/ui/google-button";

export function GoogleMapsSetupBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [actionError, setActionError] = useState<{ message: string; console_url?: string | null } | null>(null);

  const { authorizeGoogleCloud } = useGoogleAuth();

  // Check current integration status on mount
  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("gmaps_banner_dismissed");
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    getGoogleMapsStatus()
      .then((res) => {
        setIsConnected(res.connected);
      })
      .catch(() => {})
      .finally(() => setStatusChecked(true));
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("gmaps_banner_dismissed", "true");
  };

  const handleAutoConnect = async () => {
    setIsConnecting(true);
    setActionError(null);
    try {
      const accessToken = await authorizeGoogleCloud();
      toast.loading("Querying your Google Cloud account for Maps API keys…", { id: "gmaps-sync" });

      const res = await autoConnectGoogleMaps(accessToken);

      if (res.connected) {
        setIsConnected(true);
        toast.success(res.message || "Google Maps API Key connected successfully!", { id: "gmaps-sync" });
        setTimeout(() => setDismissed(true), 2500);
      } else {
        toast.dismiss("gmaps-sync");
        setActionError({
          message: res.message || "Could not automatically retrieve key from Google Cloud.",
          console_url: res.console_url,
        });
      }
    } catch (err: any) {
      toast.dismiss("gmaps-sync");
      setActionError({
        message: err?.message || "Google Cloud authorization failed. Please try again.",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualKey.trim()) return;

    setManualSaving(true);
    setActionError(null);
    try {
      const res = await saveGoogleMapsKey(manualKey.trim());
      setIsConnected(true);
      toast.success("Google Maps API Key saved and verified!");
      setTimeout(() => setDismissed(true), 2000);
    } catch (err: any) {
      toast.error(err?.message || "Failed to verify Google Maps API key");
    } finally {
      setManualSaving(false);
    }
  };

  if (!statusChecked || isConnected || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
        transition={{ duration: 0.3 }}
        className="relative mx-4 sm:mx-6 mt-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-4 shadow-subtle text-foreground overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-inner">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold tracking-tight text-foreground">
                  Connect your Free Google Maps API ($200/mo credit)
                </h4>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                  <Sparkles className="h-3 w-3" /> Auto-Sync Available
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground max-w-2xl">
                Google provides $200 free monthly credit for Maps and Places APIs. Authenticate with your Google Cloud
                account to automatically import your API key and activate live place discovery.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              size="sm"
              onClick={handleAutoConnect}
              disabled={isConnecting}
              className="gap-2 bg-primary text-primary-foreground shadow-sm hover:shadow-md text-xs font-medium"
            >
              {isConnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <GoogleLogo className="h-3.5 w-3.5" />
              )}
              {isConnecting ? "Connecting to Google Cloud…" : "Auto-Connect Free Key"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManual((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showManual ? "Hide Manual Input" : "Paste Key Manually"}
            </Button>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors ml-auto sm:ml-0"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Error / Help Banner */}
        {actionError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-danger shrink-0" />
              <span>{actionError.message}</span>
            </div>
            {actionError.console_url && (
              <a
                href={actionError.console_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
              >
                Open Google Cloud Console <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </motion.div>
        )}

        {/* Manual Key Input Drawer */}
        {showManual && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={handleManualSave}
            className="mt-3 pt-3 border-t border-border/50 flex flex-col sm:flex-row gap-2 items-center"
          >
            <div className="relative flex-1 w-full">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                placeholder="AIzaSy... (Paste Google Maps API key)"
                className="w-full rounded-md border border-border bg-background py-1.5 pl-9 pr-3 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={manualSaving}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!manualKey.trim() || manualSaving}
              className="text-xs shrink-0 w-full sm:w-auto"
            >
              {manualSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save & Verify"}
            </Button>
          </motion.form>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
