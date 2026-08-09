"use client";

import { useChatStore } from "@/lib/stores/chat-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { staggerContainerFast, staggerChild, tapProps } from "@/lib/motion";

export function ConversationList() {
  const { conversations, activeConversationId, searchQuery, setActiveConversation, setSearchQuery } = useChatStore();

  const filtered = conversations.filter((c) =>
    c.leadName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-72 shrink-0 flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <h2 className="font-display text-sm font-semibold">Inbox</h2>
        <Badge variant="default" className="text-xs">
          {conversations.reduce((s, c) => s + c.unreadCount, 0)} unread
        </Badge>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-md border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors duration-150"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">No conversations found</p>
        ) : (
          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
            className="divide-y divide-border/40"
          >
            {filtered.map((conv) => (
              <motion.button
                key={conv.id}
                variants={staggerChild}
                onClick={() => setActiveConversation(conv.id)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 relative focus-visible:outline-ring",
                  activeConversationId === conv.id ? "bg-primary/5" : "hover:bg-muted/40"
                )}
              >
                {activeConversationId === conv.id && (
                  <motion.div
                    layoutId="active-inbox-indicator"
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}

                <div className="relative mt-0.5 shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                      {conv.leadName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-success" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold">{conv.leadName}</span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: false })}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className={cn("truncate text-[11px]", conv.unreadCount > 0 ? "text-foreground font-semibold" : "text-muted-foreground")}>
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                      >
                        {conv.unreadCount}
                      </motion.span>
                    )}
                  </div>
                  <div className="mt-1.5">
                    <span className="manifest-chip">{conv.leadCountry}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
