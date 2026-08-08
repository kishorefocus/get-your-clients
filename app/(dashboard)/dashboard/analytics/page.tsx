import { PhasePlaceholder } from "@/components/features/layout/phase-placeholder";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <PhasePlaceholder
      title="Analytics"
      icon={BarChart3}
      phase="BUILD PHASE 7 · REPORTS"
      description="Conversion funnel, outreach performance by country, industry, and rep, and exportable reports — built on Recharts."
    />
  );
}
