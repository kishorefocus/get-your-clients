"use client";

import { Mail } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

export function ChatEmptyState() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-1 flex-col items-center justify-center p-8 text-center"
    >
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
        {/* Animated concentric drift envelope */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-subtle"
        >
          <Mail className="h-6 w-6" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-xl border border-primary/20 pointer-events-none"
        />
      </div>

      <span className="manifest-chip mb-2">0 · ACTIVE CONVERSATIONS</span>
      <h3 className="font-display text-sm font-semibold">Select a conversation</h3>
      <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
        Choose a client thread from the list on the left to review logs and send direct messages.
      </p>
      <p className="mt-6 text-[11px] text-muted-foreground font-mono">
        Type / in the message box for quick response templates
      </p>
    </motion.div>
  );
}
