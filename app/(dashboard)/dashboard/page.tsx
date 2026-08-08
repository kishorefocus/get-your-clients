import { Topbar } from "@/components/features/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Send, MessageSquare, DollarSign, ArrowUpRight } from "lucide-react";
import { mockLeads } from "@/lib/mock/leads";
import { formatCoords } from "@/lib/utils";

const kpis = [
  { label: "Leads found", value: "2,481", delta: "+12.4%", icon: Users },
  { label: "Outreach sent", value: "914", delta: "+6.1%", icon: Send },
  { label: "Response rate", value: "23.8%", delta: "+2.3pt", icon: MessageSquare },
  { label: "Deals in pipeline", value: "$186K", delta: "+18.9%", icon: DollarSign },
];

export default function DashboardOverviewPage() {
  const recent = mockLeads.slice(0, 5);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Overview" />
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="animate-fade-up">
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                  <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{k.value}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
                    <ArrowUpRight className="h-3 w-3" /> {k.delta} this month
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <k.icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recent.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{lead.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {lead.city}, {lead.country} · {lead.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="manifest-chip">{formatCoords(lead.lat, lead.lng)} · {lead.countryCode}</span>
                    <Badge variant={lead.stage === "won" ? "success" : lead.stage === "lost" ? "danger" : "default"}>
                      {lead.stage}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top countries this week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Turkey", "Sweden", "Japan", "Netherlands"].map((c, i) => (
                <div key={c} className="flex items-center justify-between text-sm">
                  <span>{c}</span>
                  <span className="font-mono text-xs text-muted-foreground">{(38 - i * 7)}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
