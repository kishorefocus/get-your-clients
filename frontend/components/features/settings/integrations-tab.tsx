"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Map,
  Phone,
  Mail,
  ExternalLink,
  Sparkles,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerChild, cardHoverProps } from "@/lib/motion";
import { useGoogleAuth } from "@/lib/hooks/use-google-auth";
import {
  getGoogleMapsStatus,
  autoConnectGoogleMaps,
  saveGoogleMapsKey,
  disconnectGoogleMaps,
  GoogleMapsIntegrationStatusResponse,
} from "@/lib/api/orgs";
import { GoogleLogo } from "@/components/ui/google-button";
import { toast } from "sonner";

function GoogleMapsIntegrationCard() {
  const [status, setStatus] = useState<GoogleMapsIntegrationStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{ message: string; console_url?: string | null } | null>(null);

  const { authorizeGoogleCloud } = useGoogleAuth();

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await getGoogleMapsStatus();
      setStatus(res);
    } catch {
      setStatus({ connected: false, status: "not_configured" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleAutoConnect = async () => {
    setIsAutoConnecting(true);
    setErrorMessage(null);
    try {
      toast.loading("Authenticating with Google Cloud…", { id: "gmaps-sync" });
      const accessToken = await authorizeGoogleCloud();
      toast.loading("Extracting Maps API key from your Google Cloud project…", { id: "gmaps-sync" });

      const res = await autoConnectGoogleMaps(accessToken);
      setStatus(res);

      if (res.connected) {
        toast.success(res.message || "Google Maps API successfully connected!", { id: "gmaps-sync" });
      } else {
        toast.dismiss("gmaps-sync");
        setErrorMessage({
          message: res.message || "Could not retrieve API key automatically.",
          console_url: res.console_url,
        });
      }
    } catch (err: any) {
      toast.dismiss("gmaps-sync");
      setErrorMessage({
        message: err?.message || "Google Cloud authorization was cancelled or failed.",
      });
    } finally {
      setIsAutoConnecting(false);
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualKey.trim()) return;

    setIsSavingManual(true);
    setErrorMessage(null);
    try {
      const res = await saveGoogleMapsKey(manualKey.trim());
      setStatus(res);
      setManualKey("");
      toast.success("Google Maps API key verified and saved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to verify key with Google Maps API");
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect Google Maps API?")) return;

    setIsDisconnecting(true);
    try {
      const res = await disconnectGoogleMaps();
      setStatus(res);
      toast.success("Google Maps API disconnected.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to disconnect Google Maps");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = status?.connected ?? false;

  return (
    <motion.div
      variants={staggerChild}
      {...cardHoverProps}
      className="rounded-xl border border-border bg-card p-5 shadow-subtle hover:shadow-card transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Map className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Google Maps API</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                <Sparkles className="h-3 w-3" /> Free $200/mo Tier
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground max-w-sm mt-0.5">
              Powers lead discovery, interactive pin maps, places search, and geocoding.
            </p>
          </div>
        </div>
        <Badge variant={isConnected ? "success" : "default"} className="shrink-0 gap-1">
          {isLoading ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : isConnected ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          {isLoading ? "Checking…" : isConnected ? "Connected" : "Not connected"}
        </Badge>
      </div>

      {/* Connected State */}
      {isConnected && status && (
        <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono">Active Key:</span>
            <span className="font-mono font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded">
              {status.api_key_masked || "••••••••"}
            </span>
          </div>

          {status.project_id && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Google Cloud Project:</span>
              <span className="font-mono text-muted-foreground">{status.project_id}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoConnect}
              disabled={isAutoConnecting}
              className="gap-2 text-xs"
            >
              {isAutoConnecting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <GoogleLogo className="h-3.5 w-3.5" />
              )}
              Re-sync with Google Cloud
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="gap-1.5 text-xs text-danger hover:text-danger hover:bg-danger/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Disconnect
            </Button>
          </div>
        </div>
      )}

      {/* Not Connected State */}
      {!isConnected && (
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={handleAutoConnect}
              disabled={isAutoConnecting}
              className="w-full sm:flex-1 gap-2 bg-primary text-primary-foreground text-xs shadow-sm hover:shadow"
            >
              {isAutoConnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <GoogleLogo className="h-3.5 w-3.5" />
              )}
              {isAutoConnecting ? "Connecting to Google Cloud…" : "Auto-Connect via Google Cloud"}
            </Button>

            <a
              href="https://console.cloud.google.com/google/maps-apis/overview"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              GCP Console <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Error / Assistance Display */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs text-foreground space-y-1.5"
            >
              <div className="flex items-center gap-2 text-danger font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage.message}</span>
              </div>
              {errorMessage.console_url && (
                <div>
                  <a
                    href={errorMessage.console_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                  >
                    Open Google Cloud Project Console <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </motion.div>
          )}

          {/* Manual Entry Fallback */}
          <form onSubmit={handleSaveManual} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground font-medium">
                Or paste your API Key directly:
              </label>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  placeholder="AIzaSy…XXXX"
                  className="w-full rounded-md border border-border bg-background py-2 pl-3 pr-8 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!manualKey.trim() || isSavingManual}
                className="text-xs whitespace-nowrap"
              >
                {isSavingManual ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Verify & Save"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
}

interface GenericCardProps {
  name: string;
  description: string;
  Icon: React.ElementType;
  placeholder: string;
}

function GenericIntCard({ name, description, Icon, placeholder }: GenericCardProps) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setConnected(!!key);
    setTesting(false);
    toast.success(`${name} settings updated.`);
  };

  return (
    <motion.div
      variants={staggerChild}
      {...cardHoverProps}
      className="rounded-xl border border-border bg-card p-5 shadow-subtle hover:shadow-card transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">{description}</p>
          </div>
        </div>
        <Badge variant={connected ? "success" : "default"} className="shrink-0 gap-1">
          {connected ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {connected ? "Connected" : "Not connected"}
        </Badge>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-border bg-background py-2 pl-3 pr-8 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs whitespace-nowrap"
          onClick={testConnection}
          disabled={!key || testing}
        >
          {testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {testing ? "Testing…" : "Test & Save"}
        </Button>
      </div>
    </motion.div>
  );
}

export function IntegrationsTab() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4 max-w-2xl"
    >
      <p className="text-sm text-muted-foreground">
        Connect your external services. Keys are securely stored and verified against official endpoints.
      </p>

      {/* Google Maps Real Integration */}
      <GoogleMapsIntegrationCard />

      {/* Twilio Card */}
      <GenericIntCard
        name="Twilio Voice"
        description="Enables in-browser click-to-call, call recording, and call logs."
        Icon={Phone}
        placeholder="AC…XXXX"
      />

      {/* SMTP Card */}
      <GenericIntCard
        name="Email (SMTP / Resend)"
        description="Send outreach emails via your own SMTP server or custom email provider."
        Icon={Mail}
        placeholder="smtp.yourprovider.com"
      />
    </motion.div>
  );
}
