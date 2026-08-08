"use client";

import { Topbar } from "@/components/features/layout/topbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileTab } from "@/components/features/settings/profile-tab";
import { BillingTab } from "@/components/features/settings/billing-tab";
import { IntegrationsTab } from "@/components/features/settings/integrations-tab";
import { NotificationsTab } from "@/components/features/settings/notifications-tab";
import { User, CreditCard, Puzzle, Bell } from "lucide-react";

const tabs = [
  { value: "profile", label: "Profile", icon: User, Component: ProfileTab },
  { value: "billing", label: "Billing", icon: CreditCard, Component: BillingTab },
  { value: "integrations", label: "Integrations", icon: Puzzle, Component: IntegrationsTab },
  { value: "notifications", label: "Notifications", icon: Bell, Component: NotificationsTab },
];

export default function SettingsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Settings" />
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-2">
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value}>
              <t.Component />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
