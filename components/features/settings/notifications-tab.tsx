"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface NotifItem {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

const notifGroups: { group: string; items: NotifItem[] }[] = [
  {
    group: "Leads & Pipeline",
    items: [
      { id: "lead_assigned", label: "New lead assigned to me", description: "When a manager assigns a lead to your queue.", defaultOn: true },
      { id: "stage_changed", label: "Lead stage changed", description: "When a lead you own moves to a new pipeline stage.", defaultOn: true },
      { id: "followup_due", label: "Follow-up reminder", description: "Reminder on the follow-up date you set on a lead.", defaultOn: true },
    ],
  },
  {
    group: "Inbox & Calls",
    items: [
      { id: "new_message", label: "New message received", description: "When a client sends you a new chat message.", defaultOn: true },
      { id: "call_missed", label: "Missed call", description: "When an inbound call is not answered.", defaultOn: true },
      { id: "voicemail", label: "New voicemail", description: "When a caller leaves a voicemail.", defaultOn: false },
    ],
  },
  {
    group: "Reports & Team",
    items: [
      { id: "weekly_digest", label: "Weekly performance digest", description: "A summary email every Monday with your team's metrics.", defaultOn: true },
      { id: "team_invite", label: "Teammate joined", description: "When someone accepts an organisation invite.", defaultOn: false },
    ],
  },
];

export function NotificationsTab() {
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(notifGroups.flatMap((g) => g.items).map((i) => [i.id, i.defaultOn]))
  );

  const toggle = (id: string) => setSettings((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="max-w-lg space-y-6">
      {notifGroups.map((group, gi) => (
        <div key={group.group}>
          {gi > 0 && <Separator className="mb-6" />}
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.group}
          </h3>
          <div className="space-y-4">
            {group.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <Switch
                  checked={settings[item.id]}
                  onCheckedChange={() => toggle(item.id)}
                  aria-label={item.label}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
