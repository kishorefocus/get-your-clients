"use client";

import { useState } from "react";
import { Topbar } from "@/components/features/layout/topbar";
import { Dialer } from "@/components/features/calls/dialer";
import { CallLogTable } from "@/components/features/calls/call-log-table";
import { ActiveCallOverlay } from "@/components/features/calls/active-call-overlay";
import { CallLog } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { PhoneCall, PhoneMissed, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerChild, cardHoverProps } from "@/lib/motion";
import { useCalls, useCreateCall } from "@/lib/hooks/use-calls";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { toast } from "sonner";

export default function CallsPage() {
  const [activeCall, setActiveCall] = useState<CallLog | null>(null);
  
  const { data: apiCalls, isLoading } = useCalls();
  const createCallMutation = useCreateCall();
  const leads = useLeadsStore((s) => s.leads);

  const callsToUse = apiCalls || [];

  // Compute stats
  const callsTodayCount = callsToUse.filter((c) => {
    const d = new Date(c.timestamp);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }).length;

  const answeredCount = callsToUse.filter((c) => c.outcome === "answered").length;
  const missedCount = callsToUse.filter((c) => c.outcome === "no-answer" || c.outcome === "busy" || c.outcome === "failed").length;
  
  const totalDuration = callsToUse.reduce((sum, c) => sum + c.durationSecs, 0);
  const avgDurationSecs = callsToUse.length > 0 ? Math.round(totalDuration / callsToUse.length) : 0;
  const avgDurationMin = Math.floor(avgDurationSecs / 60);
  const avgDurationSecStr = String(avgDurationSecs % 60).padStart(2, "0");
  const avgDuration = `${avgDurationMin}:${avgDurationSecStr}`;

  const statsToRender = [
    { label: "Calls today", value: String(callsTodayCount), icon: PhoneCall, color: "text-primary" },
    { label: "Answered", value: String(answeredCount), icon: PhoneCall, color: "text-success" },
    { label: "Missed", value: String(missedCount), icon: PhoneMissed, color: "text-danger" },
    { label: "Avg duration", value: callsToUse.length > 0 ? avgDuration : "0:00", icon: Clock, color: "text-accent-foreground" },
  ];

  const startCall = (log: CallLog) => setActiveCall(log);
  
  const startCallFromNumber = async (number: string) => {
    // Check if phone number is mapped to a client
    const matchedLead = leads.find((l) => l.phone === number);
    const client_id = matchedLead ? matchedLead.id : leads[0]?.id;
    if (!client_id) {
      toast.error("No client available to log call.");
      return;
    }

    // Set local active call
    const callObj: CallLog = {
      id: "new",
      leadId: client_id,
      leadName: matchedLead ? matchedLead.name : number,
      leadPhone: number,
      leadCountry: matchedLead ? matchedLead.country : "—",
      direction: "outbound",
      outcome: "answered",
      durationSecs: 15,
      timestamp: new Date().toISOString(),
      hasRecording: false,
      assignedRep: "You",
    };
    setActiveCall(callObj);

    // Call API mutation
    createCallMutation.mutate({
      client_id,
      duration_seconds: 15,
      outcome: "answered",
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Call Center" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6 scrollbar-thin">
        {/* Stats row */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6"
        >
          {statsToRender.map((s) => (
            <motion.div key={s.label} variants={staggerChild} {...cardHoverProps}>
              <Card className="hover:shadow-card transition-shadow">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${s.color}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="font-display text-xl font-semibold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main layout: dialer + log */}
        <div className="flex gap-6 items-start flex-col xl:flex-row">
          <div className="shrink-0 w-full sm:w-auto flex justify-center sm:block">
            <Dialer onCall={startCallFromNumber} />
          </div>
          <div className="flex-1 min-w-0 w-full">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <CallLogTable calls={callsToUse} onStartCall={startCall} />
            )}
          </div>
        </div>
      </div>

      {/* Active call overlay */}
      <ActiveCallOverlay call={activeCall} onEnd={() => setActiveCall(null)} />
    </div>
  );
}
