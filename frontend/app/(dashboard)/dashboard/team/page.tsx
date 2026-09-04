"use client";

import { useState } from "react";
import { Topbar } from "@/components/features/layout/topbar";
import { MemberCard } from "@/components/features/team/member-card";
import { InviteModal } from "@/components/features/team/invite-modal";
import { mockTeam } from "@/lib/mock/team";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Shield, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { staggerContainer, staggerChild, cardHoverProps } from "@/lib/motion";
import { useOrgMembers } from "@/lib/hooks/use-org";
import { TeamMember } from "@/types";

/** Adapt a backend OrgMember to the frontend TeamMember shape. */
function adaptMember(m: {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  status?: string;
}): TeamMember & { status?: string } {
  const roleMap: Record<string, TeamMember["role"]> = {
    admin: "Admin",
    manager: "Manager",
    rep: "Rep",
  };
  return {
    id: m.id,
    name: m.full_name ?? m.email,
    role: roleMap[m.role] ?? "Rep",
    email: m.email,
    online: m.is_active,
    status: m.status,
  };
}

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const { data: apiMembers, isLoading } = useOrgMembers();

  // Use real API members when available, fall back to mock data
  const team: (TeamMember & { status?: string })[] =
    apiMembers && apiMembers.length > 0 ? apiMembers.map(adaptMember) : mockTeam;

  const roleCounts = team.reduce(
    (acc, m) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  const orgStats = [
    { label: "Total members", value: team.length, icon: Users },
    { label: "Admins", value: roleCounts["Admin"] || 0, icon: Shield },
    { label: "Managers", value: roleCounts["Manager"] || 0, icon: Briefcase },
    { label: "Reps", value: roleCounts["Rep"] || 0, icon: Users },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar
        title="Team"
        actions={
          <Button onClick={() => setInviteOpen(true)} size="sm" className="h-8 gap-1.5 px-2.5 text-xs focus-visible:outline-ring">
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Invite teammate</span>
            <span className="sm:hidden">Invite</span>
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6 scrollbar-thin">
        {/* Org stats */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6"
        >
          {orgStats.map((s) => (
            <motion.div key={s.label} variants={staggerChild} {...cardHoverProps}>
              <Card className="hover:shadow-card transition-shadow">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="font-display text-xl font-semibold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Member grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {team.map((member, i) => (
              <MemberCard key={member.id} member={member} index={i} />
            ))}
          </motion.div>
        )}
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
