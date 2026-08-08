import { PhasePlaceholder } from "@/components/features/layout/phase-placeholder";
import { Inbox } from "lucide-react";

export default function InboxPage() {
  return (
    <PhasePlaceholder
      title="Inbox"
      icon={Inbox}
      phase="BUILD PHASE 5 · REAL-TIME CHAT"
      description="Unified inbox for every client conversation, with delivery/read status, canned responses, and attachments over a live socket connection."
    />
  );
}
