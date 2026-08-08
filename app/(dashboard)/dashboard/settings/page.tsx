import { PhasePlaceholder } from "@/components/features/layout/phase-placeholder";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <PhasePlaceholder
      title="Settings"
      icon={Settings}
      phase="BUILD PHASE 8 · SETTINGS"
      description="Profile, billing, integrations (Maps, Twilio, email provider), and notification preferences."
    />
  );
}
