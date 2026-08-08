"use client";

import { MessageSquare } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h3 className="font-display text-base font-semibold">Select a conversation</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          Choose a client conversation from the list to start reading and replying.
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground font-mono">
        Type / in the message box for quick response templates
      </p>
    </div>
  );
}
