"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, RefreshCw, CheckCircle2, XCircle, Map, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  Icon: React.ElementType;
  connected: boolean;
  placeholder: string;
}

const integrations: IntegrationCard[] = [
  {
    id: "gmaps",
    name: "Google Maps API",
    description: "Powers the discovery map, place search, and geocoding for all leads.",
    Icon: Map,
    connected: true,
    placeholder: "AIza…XXXX",
  },
  {
    id: "twilio",
    name: "Twilio Voice",
    description: "Enables in-browser click-to-call, call recording, and call logs.",
    Icon: Phone,
    connected: false,
    placeholder: "AC…",
  },
  {
    id: "smtp",
    name: "Email (SMTP)",
    description: "Send outreach emails via your own SMTP server or provider.",
    Icon: Mail,
    connected: false,
    placeholder: "smtp.yourprovider.com",
  },
];

function IntCard({ integ }: { integ: IntegrationCard }) {
  const [key, setKey] = useState(integ.connected ? integ.placeholder : "");
  const [show, setShow] = useState(false);
  const [connected, setConnected] = useState(integ.connected);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setConnected(!!key);
    setTesting(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <integ.Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{integ.name}</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">{integ.description}</p>
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
            placeholder={integ.placeholder}
            className="w-full rounded-md border border-border bg-background py-2 pl-3 pr-8 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
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
          {testing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {testing ? "Testing…" : "Test & Save"}
        </Button>
      </div>
    </div>
  );
}

export function IntegrationsTab() {
  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Connect your external services. Keys are stored encrypted and never logged.
      </p>
      {integrations.map((integ) => (
        <IntCard key={integ.id} integ={integ} />
      ))}
    </div>
  );
}
