"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/features/layout/topbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileTab } from "@/components/features/settings/profile-tab";
import { BillingTab } from "@/components/features/settings/billing-tab";
import { IntegrationsTab } from "@/components/features/settings/integrations-tab";
import { NotificationsTab } from "@/components/features/settings/notifications-tab";
import { AuditLogsTab } from "@/components/features/settings/audit-logs-tab";
import { User, CreditCard, Puzzle, Bell, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { springUI } from "@/lib/motion";

const tabs = [
  { value: "profile", label: "Profile", icon: User, Component: ProfileTab },
  { value: "billing", label: "Billing", icon: CreditCard, Component: BillingTab },
  { value: "integrations", label: "Integrations", icon: Puzzle, Component: IntegrationsTab },
  { value: "notifications", label: "Notifications", icon: Bell, Component: NotificationsTab },
  { value: "audit", label: "Audit Logs", icon: Shield, Component: AuditLogsTab },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (tabParam && tabs.some((t) => t.value === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Settings" />
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <Tabs defaultValue="profile" onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-muted/40 relative">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="gap-2 relative focus-visible:outline-ring data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <t.icon className="h-3.5 w-3.5 relative z-10" />
                <span className="relative z-10">{t.label}</span>
                {activeTab === t.value && (
                  <motion.div
                    layoutId="active-settings-tab"
                    className="absolute inset-0 rounded-md bg-background shadow-subtle z-0"
                    transition={springUI}
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value} className="mt-0 focus-visible:outline-none">
              {activeTab === t.value && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <t.Component />
                </motion.div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
