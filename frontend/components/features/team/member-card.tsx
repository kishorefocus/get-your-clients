"use client";

import { TeamMember } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { staggerChild, cardHoverProps, tapProps } from "@/lib/motion";

const roleMeta: Record<TeamMember["role"], { variant: "default" | "success" | "danger"; label: string }> = {
  Admin: { variant: "danger", label: "Admin" },
  Manager: { variant: "success", label: "Manager" },
  Rep: { variant: "default", label: "Rep" },
};

const avatarColors = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-accent/20 text-accent-foreground",
  "bg-danger/10 text-danger",
];

interface Props {
  member: TeamMember;
  index: number;
}

export function MemberCard({ member, index }: Props) {
  const colorCls = avatarColors[index % avatarColors.length];
  const role = roleMeta[member.role];

  return (
    <motion.div
      variants={staggerChild}
      {...cardHoverProps}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-subtle hover:shadow-card transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-11 w-11">
              <AvatarFallback className={cn("text-sm font-bold", colorCls)}>
                {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {/* Online dot pulsing */}
            {member.online ? (
              <motion.span
                animate={{ scale: [1, 1.25, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success"
              />
            ) : (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/30" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{member.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{member.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={role.variant}>{role.label}</Badge>
          <motion.div {...tapProps}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-border/60" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="font-display text-lg font-semibold">{member.assignedLeads ?? 0}</p>
          <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <Users className="h-3 w-3" /> Leads
          </p>
        </div>
        <div>
          <p className="font-display text-lg font-semibold">{member.dealsWon ?? 0}</p>
          <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <Trophy className="h-3 w-3" /> Won
          </p>
        </div>
        <div>
          <p className={cn("font-display text-lg font-semibold", member.online ? "text-success" : "text-muted-foreground")}>
            {member.online ? "Online" : "Away"}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">STATUS</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex gap-2">
        <motion.div {...tapProps} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs h-8">
            <Mail className="h-3.5 w-3.5" /> Message
          </Button>
        </motion.div>
        <motion.div {...tapProps} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full text-xs h-8">
            View leads
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
