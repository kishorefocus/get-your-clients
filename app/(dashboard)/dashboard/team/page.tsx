import { PhasePlaceholder } from "@/components/features/layout/phase-placeholder";
import { Users } from "lucide-react";

export default function TeamPage() {
  return (
    <PhasePlaceholder
      title="Team"
      icon={Users}
      phase="BUILD PHASE 8 · ORG MANAGEMENT"
      description="Invite teammates, assign leads, and manage role-based permissions across Admin, Manager, and Rep."
    />
  );
}
