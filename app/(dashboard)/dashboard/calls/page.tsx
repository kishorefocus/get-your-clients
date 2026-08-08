import { PhasePlaceholder } from "@/components/features/layout/phase-placeholder";
import { Phone } from "lucide-react";

export default function CallsPage() {
  return (
    <PhasePlaceholder
      title="Calls"
      icon={Phone}
      phase="BUILD PHASE 6 · IN-BROWSER CALLING"
      description="Click-to-call over WebRTC/Twilio Voice, with call logs, recordings, live in-call notes, and a running call timer."
    />
  );
}
