"use client";

import { Topbar } from "@/components/features/layout/topbar";
import { ConversationList } from "@/components/features/chat/conversation-list";
import { MessageThread } from "@/components/features/chat/message-thread";
import { MessageInput } from "@/components/features/chat/message-input";
import { ChatEmptyState } from "@/components/features/chat/chat-empty-state";
import { useChatStore } from "@/lib/stores/chat-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Phone, Video, Info, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

function ConversationHeader() {
  const { conversations, activeConversationId } = useChatStore();
  const conv = conversations.find((c) => c.id === activeConversationId);
  if (!conv) return null;

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
            {conv.leadName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold leading-none">{conv.leadName}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
            Online · {conv.leadCountry}
            {conv.assignedRep && <> · Assigned to {conv.assignedRep}</>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Voice call">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Video call">
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Client details">
          <Info className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="More options">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const { activeConversationId } = useChatStore();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Inbox" />
      <div className="flex min-h-0 flex-1">
        <ConversationList />
        <div className="flex min-h-0 flex-1 flex-col bg-surface">
          {activeConversationId ? (
            <>
              <ConversationHeader />
              <MessageThread />
              <MessageInput />
            </>
          ) : (
            <ChatEmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
