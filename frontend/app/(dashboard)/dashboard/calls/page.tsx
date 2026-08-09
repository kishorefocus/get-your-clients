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

const stats = [
  { label: "Calls today", value: "12", icon: PhoneCall, color: "text-primary" },
  { label: "Answered", value: "8", icon: PhoneCall, color: "text-success" },
  { label: "Missed", value: "4", icon: PhoneMissed, color: "text-danger" },
  { label: "Avg duration", value: "6:42", icon: Clock, color: "text-accent-foreground" },
];

export default function CallsPage() {
  const [activeCall, setActiveCall] = useState<CallLog | null>(null);

  const startCall = (log: CallLog) => setActiveCall(log);
  const startCallFromNumber = (number: string) => {
    setActiveCall({
      id: "new",
      leadId: "",
      leadName: number,
      leadPhone: number,
      leadCountry: "—",
      direction: "outbound",
      outcome: "answered",
      durationSecs: 0,
      timestamp: new Date().toISOString(),
      hasRecording: false,
      assignedRep: "You",
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Call Center" />
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {/* Stats row */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6"
        >
          {stats.map((s) => (
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
          <div className="shrink-0">
            <Dialer onCall={startCallFromNumber} />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <CallLogTable onStartCall={startCall} />
          </div>
        </div>
      </div>

      {/* Active call overlay */}
      <ActiveCallOverlay call={activeCall} onEnd={() => setActiveCall(null)} />
    </div>
  );
}
