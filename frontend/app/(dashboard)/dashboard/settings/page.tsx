"use client";

import { useState } from "react";
import { Topbar } from "@/components/features/layout/topbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileTab } from "@/components/features/settings/profile-tab";
import { BillingTab } from "@/components/features/settings/billing-tab";
import { IntegrationsTab } from "@/components/features/settings/integrations-tab";
import { NotificationsTab } from "@/components/features/settings/notifications-tab";
import { User, CreditCard, Puzzle, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, tapProps, springUI } from "@/lib/motion";

const tabs = [
  { value: "profile", label: "Profile", icon: User, Component: ProfileTab },
  { value: "billing", label: "Billing", icon: CreditCard, Component: BillingTab },
  { value: "integrations", label: "Integrations", icon: Puzzle, Component: IntegrationsTab },
  { value: "notifications", label: "Notifications", icon: Bell, Component: NotificationsTab },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

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
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {tabs.map((t) => (
                <TabsContent key={t.value} value={t.value} className="mt-0 focus-visible:outline-none">
                  <t.Component />
                </TabsContent>
              ))}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
