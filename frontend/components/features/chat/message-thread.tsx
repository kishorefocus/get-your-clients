"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/lib/stores/chat-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, CheckCheck, Clock, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Message, MessageStatus } from "@/types";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { slideInLeft, slideInRight, fadeIn, EASE_OUT } from "@/lib/motion";

function StatusIcon({ status }: { status: MessageStatus }) {
  if (status === "sending") return <Clock className="h-3 w-3 text-muted-foreground" />;
  if (status === "sent") return <Check className="h-3 w-3 text-muted-foreground" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
  if (status === "read") return <CheckCheck className="h-3 w-3 text-primary" />;
  return null;
}

function MessageBubble({ msg }: { msg: Message }) {
  const prefersReduced = useReducedMotion();
  const animationVariant = msg.isMe ? slideInRight : slideInLeft;

  return (
    <motion.div
      variants={prefersReduced ? {} : animationVariant}
      initial="hidden"
      animate="visible"
      className={cn("flex items-end gap-2", msg.isMe ? "flex-row-reverse" : "flex-row")}
    >
      {!msg.isMe && (
        <Avatar className="h-7 w-7 shrink-0 self-end">
          <AvatarFallback className="bg-muted text-[10px] font-semibold">
            {msg.senderName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn("group flex max-w-[70%] flex-col gap-1", msg.isMe && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-subtle transition-all duration-150",
            msg.isMe
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-card border border-border text-foreground hover:border-border/80"
          )}
        >
          {msg.content}
          {msg.attachments?.map((att) => (
            <a
              key={att.name}
              href={att.url}
              className={cn(
                "mt-2 flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                msg.isMe
                  ? "border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  : "border-border text-foreground hover:bg-muted"
              )}
            >
              <Paperclip className="h-3 w-3" />
              {att.name}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(msg.timestamp), "HH:mm")}
          </span>
          {msg.isMe && <StatusIcon status={msg.status} />}
        </div>
      </div>
    </motion.div>
  );
}

export function MessageThread() {
  const { conversations, activeConversationId } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const conv = conversations.find((c) => c.id === activeConversationId);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages.length, showTyping]);

  // Simulate typing indicator briefly after a user message
  useEffect(() => {
    if (!conv) return;
    const lastMsg = conv.messages[conv.messages.length - 1];
    if (lastMsg && lastMsg.isMe) {
      const timer = setTimeout(() => {
        setShowTyping(true);
        // Turn off typing after 3 seconds and simulate reply status update
        const closeTimer = setTimeout(() => {
          setShowTyping(false);
        }, 3200);
        return () => clearTimeout(closeTimer);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [conv?.messages.length]);

  if (!conv) return null;

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  conv.messages.forEach((msg) => {
    const dateStr = format(new Date(msg.timestamp), "MMMM d, yyyy");
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateStr) {
      last.msgs.push(msg);
    } else {
      grouped.push({ date: dateStr, msgs: [msg] });
    }
  });

  return (
    <motion.div
      key={activeConversationId}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="flex flex-1 flex-col overflow-y-auto p-4 space-y-1 scrollbar-thin"
    >
      {grouped.map((group) => (
        <div key={group.date} className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-medium text-muted-foreground">{group.date}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-3">
            {group.msgs.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      <AnimatePresence>
        {showTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 mt-4"
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-muted text-[10px] font-semibold">
                {conv.leadName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="rounded-2xl rounded-bl-md bg-card border border-border px-4 py-3 flex gap-1 items-center h-8">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </motion.div>
  );
}
