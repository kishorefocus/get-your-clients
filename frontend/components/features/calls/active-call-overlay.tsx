"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Pause, Volume2 } from "lucide-react";
import { CallLog } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  call: CallLog | null;
  onEnd: () => void;
}

function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) { setSecs(0); return; }
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function ActiveCallOverlay({ call, onEnd }: Props) {
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [notes, setNotes] = useState("");
  const timer = useTimer(!!call);

  if (!call) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/30 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background shadow-popover overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-primary/10 to-transparent px-6 pt-8 pb-4">
          {/* Animated rings */}
          <div className="relative flex items-center justify-center">
            <div className={cn("absolute h-20 w-20 rounded-full bg-success/20 animate-pulse-ring")} />
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {call.leadName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-semibold">{call.leadName}</p>
            <p className="text-sm text-muted-foreground font-mono">{call.leadPhone}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-success">{timer}</p>
            {onHold && (
              <span className="mt-1 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                On Hold
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 py-4 px-6">
          <button
            onClick={() => setMuted((v) => !v)}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors",
              muted ? "border-danger bg-danger/10 text-danger" : "border-border bg-muted text-foreground hover:bg-muted/80"
            )}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            onClick={onEnd}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-danger-foreground shadow-lg hover:bg-danger/90 transition-colors"
            title="End call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          <button
            onClick={() => setOnHold((v) => !v)}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors",
              onHold ? "border-accent bg-accent/10 text-accent-foreground" : "border-border bg-muted text-foreground hover:bg-muted/80"
            )}
            title={onHold ? "Resume" : "Hold"}
          >
            <Pause className="h-5 w-5" />
          </button>
        </div>

        {/* Notes */}
        <div className="border-t border-border px-4 pb-4 pt-3">
          <label className="mb-1.5 block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Live call notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Take notes during the call…"
            rows={3}
            className="w-full resize-none rounded-md border border-border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring scrollbar-thin"
          />
        </div>
      </div>
    </div>
  );
}
