"use client";

import { repStats } from "@/lib/mock/analytics";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { staggerContainerFast, staggerChild, scaleInSpring } from "@/lib/motion";

const medals = ["🥇", "🥈", "🥉"];

export function RepLeaderboard() {
  const sorted = [...repStats].sort((a, b) => b.dealsWon - a.dealsWon);

  return (
    <div className="rounded-xl border border-border bg-card shadow-subtle overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3 bg-muted/20">
        <Trophy className="h-4 w-4 text-accent" />
        <h3 className="font-display text-sm font-semibold">Rep Leaderboard</h3>
      </div>
      <motion.div
        variants={staggerContainerFast}
        initial="hidden"
        animate="visible"
        className="divide-y divide-border"
      >
        {sorted.map((rep, i) => (
          <motion.div
            key={rep.id}
            variants={staggerChild}
            className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors duration-150"
          >
            <div className="w-6 text-center text-base">
              {medals[i] ? (
                <motion.span
                  variants={scaleInSpring}
                  className="inline-block"
                >
                  {medals[i]}
                </motion.span>
              ) : (
                <span className="text-xs text-muted-foreground font-mono">{i + 1}</span>
              )}
            </div>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                {rep.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{rep.name}</p>
              <p className="text-[10px] text-muted-foreground">{rep.outreachSent} outreach · {rep.callsMade} calls</p>
            </div>
            <div className="text-right shrink-0">
              <p className={cn("font-display text-sm font-bold", i === 0 ? "text-accent" : "text-foreground")}>
                {rep.dealsWon} won
              </p>
              <p className="text-[10px] text-muted-foreground">{rep.responseRate}% resp.</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
