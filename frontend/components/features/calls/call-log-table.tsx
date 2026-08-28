"use client";

import { useState } from "react";
import { mockCallLogs, formatDuration } from "@/lib/mock/calls";
import { CallLog } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Mic, Play, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainerFast, staggerChild, tapProps, EASE_OUT } from "@/lib/motion";

function outcomeIcon(outcome: CallLog["outcome"], direction: CallLog["direction"]) {
  if (outcome === "no-answer" || outcome === "busy" || outcome === "failed")
    return <PhoneMissed className="h-4 w-4 text-danger" />;
  if (direction === "inbound") return <PhoneIncoming className="h-4 w-4 text-success" />;
  return <PhoneOutgoing className="h-4 w-4 text-primary" />;
}

const outcomeVariantMap: Record<CallLog["outcome"], "default" | "success" | "danger"> = {
  answered: "success",
  voicemail: "default",
  "no-answer": "danger",
  busy: "danger",
  failed: "danger",
};

interface Props {
  calls?: CallLog[];
  onStartCall: (log: CallLog) => void;
}

export function CallLogTable({ calls, onStartCall }: Props) {
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const displayCalls = calls || mockCallLogs;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
      <div className="flex h-11 items-center border-b border-border px-4 bg-muted/20 justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Calls
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {displayCalls.length}
        </span>
      </div>
      <motion.div
        variants={staggerContainerFast}
        initial="hidden"
        animate="visible"
        className="divide-y divide-border"
      >
        {displayCalls.map((log) => (
          <motion.div
            key={log.id}
            variants={staggerChild}
            className="group px-4 py-3 hover:bg-muted/30 transition-colors duration-150 relative"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                {outcomeIcon(log.outcome, log.direction)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{log.leadName}</p>
                  <span className="manifest-chip shrink-0">{log.leadCountry}</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">{log.leadPhone}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-mono font-semibold">{formatDuration(log.durationSecs)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant={outcomeVariantMap[log.outcome]} className="hidden sm:flex capitalize">
                  {log.outcome.replace("-", " ")}
                </Badge>
                {log.hasRecording && (
                  <motion.div {...tapProps}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Play recording">
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                )}
                {log.notes && (
                  <motion.div {...tapProps}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setExpandedNote(expandedNote === log.id ? null : log.id)}
                      title="View notes"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                )}
                <motion.div {...tapProps}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1.5 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100"
                    onClick={() => onStartCall(log)}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call back
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Smooth Expand height notes panel */}
            <AnimatePresence initial={false}>
              {expandedNote === log.id && log.notes && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <div className="ml-12 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground border border-border/80">
                    <p className="font-semibold text-foreground mb-0.5">Call notes</p>
                    {log.notes}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
