"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateThread, getMessageHistory, MessageResponse } from "@/lib/api/chat";
import { buildWsUrl } from "@/lib/api/client";
import { useChatStore, backendMsgToFrontend } from "@/lib/stores/chat-store";
import { toast } from "sonner";

export const CHAT_KEYS = {
  history: (threadId: string) => ["chat", "history", threadId] as const,
};

/** Fetch paginated message history for a thread (initial load). */
export function useMessageHistory(threadId: string | null) {
  return useQuery({
    queryKey: CHAT_KEYS.history(threadId ?? ""),
    queryFn: () => getMessageHistory(threadId!),
    enabled: !!threadId,
    staleTime: 0,
  });
}

/**
 * Opens a WebSocket to /ws/chat/{threadId} for a given clientId.
 * Automatically resolves (or creates) the thread via REST first, then
 * subscribes to live "message.new" events and writes them into the chat store.
 */
export function useChatThread(conversationId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const threadIdRef = useRef<string | null>(null);
  const appendMessage = useChatStore((s) => s.appendBackendMessage);

  useEffect(() => {
    if (!conversationId) return;
    const activeConversationId = conversationId as string;

    let cancelled = false;

    async function connect() {
      // Find the lead/client id from the conversation
      const store = useChatStore.getState();
      const conv = store.conversations.find((c) => c.id === activeConversationId);
      if (!conv) return;

      try {
        const { thread_id } = await getOrCreateThread(conv.leadId);
        if (cancelled) return;
        threadIdRef.current = thread_id;
        store.setThreadId(activeConversationId, thread_id);

        try {
          const history = await getMessageHistory(thread_id);
          if (!cancelled) {
            const mapped = history.map((msg) => backendMsgToFrontend(activeConversationId, msg));
            store.setMessages(activeConversationId, mapped);
          }
        } catch {
          // ignore and keep mock messages
        }

        const url = buildWsUrl(`/ws/chat/${thread_id}`);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const frame = JSON.parse(event.data);
            if (frame.event === "message.new") {
              appendMessage(activeConversationId, frame.data as MessageResponse);
            }
          } catch {
            // ignore malformed frames
          }
        };

        ws.onerror = () => {
          if (!cancelled) toast.error("Chat connection error. Reconnecting…");
        };
      } catch {
        // Backend unreachable — silently stay in mock mode
      }
    }

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
      threadIdRef.current = null;
    };
  }, [conversationId, appendMessage]);

  const sendWsMessage = useCallback(
    (body: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ body }));
        return true;
      }
      return false; // fall back to mock send in store
    },
    []
  );

  return { threadId: threadIdRef.current, sendWsMessage };
}
