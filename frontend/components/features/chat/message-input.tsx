"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useChatStore } from "@/lib/stores/chat-store";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Zap } from "lucide-react";
import { cannedResponses } from "@/lib/mock/conversations";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { tapProps } from "@/lib/motion";

export function MessageInput() {
  const [text, setText] = useState("");
  const [showCanned, setShowCanned] = useState(false);
  const { activeConversationId, sendMessage } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!activeConversationId || !text.trim()) return;
    sendMessage(activeConversationId, text);
    setText("");
    setShowCanned(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "/" && text === "") {
      setShowCanned(true);
    }
  };

  const applyCanned = (t: string) => {
    setText(t);
    setShowCanned(false);
    textareaRef.current?.focus();
  };

  if (!activeConversationId) return null;

  return (
    <div className="shrink-0 border-t border-border bg-background p-3">
      {/* Canned responses dropdown with motion */}
      <AnimatePresence>
        {showCanned && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="mb-2 rounded-lg border border-border bg-background shadow-popover overflow-hidden"
          >
            <p className="border-b border-border px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
              Quick Responses — type / to open
            </p>
            <div className="max-h-48 overflow-y-auto scrollbar-thin">
              {cannedResponses.map((r) => (
                <button
                  key={r.label}
                  onClick={() => applyCanned(r.text)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-muted transition-colors focus-visible:outline-ring"
                >
                  <span className="text-xs font-semibold">{r.label}</span>
                  <span className="line-clamp-1 text-[11px] text-muted-foreground">{r.text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value !== "/") setShowCanned(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (/ for quick responses, Enter to send)"
            rows={2}
            className={cn(
              "w-full resize-none rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/30 scrollbar-thin transition-shadow focus:bg-background"
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <motion.div {...tapProps}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setShowCanned((v) => !v)}
              title="Quick responses (/)"
            >
              <Zap className="h-4 w-4" />
            </Button>
          </motion.div>
          
          <motion.div {...tapProps}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div {...tapProps}>
            <Button
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleSend}
              disabled={!text.trim()}
              title="Send (Enter)"
            >
              <Send className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
