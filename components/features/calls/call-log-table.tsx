"use client";

import { useState } from "react";
import { mockCallLogs, formatDuration } from "@/lib/mock/calls";
import { CallLog } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Mic, Play, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ActiveCallOverlay } from "./active-call-overlay";

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
  onStartCall: (log: CallLog) => void;
}

export function CallLogTable({ onStartCall }: Props) {
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
      <div className="flex h-11 items-center border-b border-border px-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Calls ({mockCallLogs.length})
        </span>
      </div>
      <div className="divide-y divide-border">
        {mockCallLogs.map((log) => (
          <div key={log.id} className="group px-4 py-3 hover:bg-muted/40 transition-colors">
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
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" title="Play recording">
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                )}
                {log.notes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground"
                    onClick={() => setExpandedNote(expandedNote === log.id ? null : log.id)}
                    title="View notes"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onStartCall(log)}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call back
                </Button>
              </div>
            </div>
            {expandedNote === log.id && log.notes && (
              <div className="mt-2 ml-12 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground border border-border">
                <p className="font-semibold text-foreground mb-0.5">Call notes</p>
                {log.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
