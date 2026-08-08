"use client";

import { useChatStore } from "@/lib/stores/chat-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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
            className="w-full rounded-md border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">No conversations found</p>
        )}
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setActiveConversation(conv.id)}
            className={cn(
              "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/60",
              activeConversationId === conv.id && "bg-primary/5"
            )}
          >
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
                <p className="truncate text-[11px] text-muted-foreground">{conv.lastMessage}</p>
                {conv.unreadCount > 0 && (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <span className="manifest-chip mt-1.5">{conv.leadCountry}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
