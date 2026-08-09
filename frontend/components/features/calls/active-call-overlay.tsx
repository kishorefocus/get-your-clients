"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Pause, Volume2 } from "lucide-react";
import { CallLog } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { scaleInSpring, fadeIn, tapProps } from "@/lib/motion";

interface Props {
  call: CallLog | null;
  onEnd: () => void;
}

type CallPhase = "dialing" | "connected" | "ended";

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
  
  // Custom Call Phase Machine
  const [phase, setPhase] = useState<CallPhase>("dialing");

  useEffect(() => {
    if (!call) return;
    setPhase("dialing");
    
    // Simulate dialing → connected after 2.2 seconds
    const timer = setTimeout(() => {
      setPhase("connected");
    }, 2200);

    return () => clearTimeout(timer);
  }, [call]);

  const timer = useTimer(!!call && phase === "connected" && !onHold);

  if (!call) return null;

  const handleEndCall = () => {
    setPhase("ended");
    setTimeout(() => {
      onEnd();
      setNotes("");
    }, 800);
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
      >
        <motion.div
          variants={scaleInSpring}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-sm rounded-2xl border border-border bg-background shadow-popover overflow-hidden"
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-primary/10 to-transparent px-6 pt-8 pb-4 relative">
            
            {/* Concentric Animated Rings */}
            <div className="relative flex items-center justify-center h-20 w-20">
              {phase === "dialing" && (
                <>
                  <div className="absolute h-20 w-20 rounded-full bg-primary/20 animate-pulse-ring" />
                  <div className="absolute h-20 w-20 rounded-full bg-primary/10 animate-pulse-ring-slow" />
                </>
              )}
              {phase === "connected" && !onHold && (
                <>
                  <div className="absolute h-20 w-20 rounded-full bg-success/20 animate-pulse-ring" />
                  <div className="absolute h-20 w-20 rounded-full bg-success/10 animate-pulse-ring-slow" />
                </>
              )}
              <Avatar className="h-16 w-16 border-2 border-border z-10">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {call.leadName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="text-center">
              <p className="font-display text-lg font-semibold">{call.leadName}</p>
              <p className="text-sm text-muted-foreground font-mono">{call.leadPhone}</p>
              
              <AnimatePresence mode="wait">
                {phase === "dialing" && (
                  <motion.p
                    key="dialing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-1 font-mono text-sm font-semibold text-primary animate-pulse"
                  >
                    Dialing line…
                  </motion.p>
                )}
                {phase === "connected" && (
                  <motion.p
                    key="connected"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-1 font-mono text-2xl font-bold text-success"
                  >
                    {timer}
                  </motion.p>
                )}
                {phase === "ended" && (
                  <motion.p
                    key="ended"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 font-mono text-sm font-semibold text-danger"
                  >
                    Call ended
                  </motion.p>
                )}
              </AnimatePresence>

              {onHold && (
                <span className="mt-1.5 inline-block rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground animate-pulse">
                  On Hold
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-5 py-4 px-6">
            <motion.div {...tapProps}>
              <button
                type="button"
                onClick={() => setMuted((v) => !v)}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border transition-colors duration-150 focus-visible:outline-ring",
                  muted ? "border-danger bg-danger/10 text-danger" : "border-border bg-muted text-foreground hover:bg-muted/80"
                )}
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                type="button"
                onClick={handleEndCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-danger-foreground shadow-card hover:bg-danger/90 hover:shadow-popover transition-all duration-150 focus-visible:outline-ring"
                title="End call"
              >
                <PhoneOff className="h-6 w-6" />
              </button>
            </motion.div>

            <motion.div {...tapProps}>
              <button
                type="button"
                onClick={() => setOnHold((v) => !v)}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border transition-colors duration-150 focus-visible:outline-ring",
                  onHold ? "border-accent bg-accent/10 text-accent-foreground" : "border-border bg-muted text-foreground hover:bg-muted/80"
                )}
                title={onHold ? "Resume" : "Hold"}
              >
                <Pause className="h-5 w-5" />
              </button>
            </motion.div>
          </div>

          {/* Notes */}
          <div className="border-t border-border px-4 pb-5 pt-3 bg-muted/20">
            <label className="mb-1.5 block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Live call notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Take notes during the call…"
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring scrollbar-thin transition-shadow"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
