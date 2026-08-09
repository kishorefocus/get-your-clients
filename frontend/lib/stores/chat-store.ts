import { create } from "zustand";
import { Conversation, Message } from "@/types";
import { mockConversations } from "@/lib/mock/conversations";
import { MessageResponse } from "@/lib/api/chat";

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  searchQuery: string;
  /** threadId keyed by conversationId — set when WS connects. */
  threadIds: Record<string, string>;
  setActiveConversation: (id: string) => void;
  setSearchQuery: (q: string) => void;
  /** Send via mock (optimistic) — use sendWsMessage from useChatThread for real WS. */
  sendMessage: (conversationId: string, content: string) => void;
  markAsRead: (conversationId: string) => void;
  totalUnread: () => number;
  /** Called by useChatThread when a real WS message.new event arrives. */
  appendBackendMessage: (conversationId: string, msg: MessageResponse) => void;
  setThreadId: (conversationId: string, threadId: string) => void;
}

function backendMsgToFrontend(conversationId: string, msg: MessageResponse): Message {
  return {
    id: msg.id,
    conversationId,
    senderId: msg.sender_user_id ?? "unknown",
    senderName: msg.sender_user_id ? "You" : "Remote",
    content: msg.body,
    timestamp: msg.created_at,
    status: msg.status as Message["status"],
    isMe: !!msg.sender_user_id, // heuristic: if sender_user_id is set it's the current user
  };
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: mockConversations,
  activeConversationId: null,
  searchQuery: "",
  threadIds: {},

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    get().markAsRead(id);
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  setThreadId: (conversationId, threadId) =>
    set((state) => ({
      threadIds: { ...state.threadIds, [conversationId]: threadId },
    })),

  sendMessage: (conversationId, content) => {
    if (!content.trim()) return;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      conversationId,
      senderId: "me",
      senderName: "You",
      content: content.trim(),
      timestamp: new Date().toISOString(),
      status: "sending",
      isMe: true,
    };

    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [...c.messages, newMsg],
              lastMessage: content.trim(),
              lastMessageTime: newMsg.timestamp,
            }
          : c
      ),
    }));

    // Optimistic status progression (mock mode fallback)
    setTimeout(() => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, messages: c.messages.map((m) => (m.id === newMsg.id ? { ...m, status: "sent" } : m)) }
            : c
        ),
      }));
    }, 400);

    setTimeout(() => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, messages: c.messages.map((m) => (m.id === newMsg.id ? { ...m, status: "delivered" } : m)) }
            : c
        ),
      }));
    }, 1000);
  },

  appendBackendMessage: (conversationId, msg) => {
    const frontendMsg = backendMsgToFrontend(conversationId, msg);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              // Deduplicate by id in case the optimistic message already exists
              messages: c.messages.some((m) => m.id === frontendMsg.id)
                ? c.messages.map((m) => (m.id === frontendMsg.id ? frontendMsg : m))
                : [...c.messages, frontendMsg],
              lastMessage: frontendMsg.content,
              lastMessageTime: frontendMsg.timestamp,
            }
          : c
      ),
    }));
  },

  markAsRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  totalUnread: () => {
    return get().conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  },
}));
