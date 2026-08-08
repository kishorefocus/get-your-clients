import { create } from "zustand";
import { Conversation, Message } from "@/types";
import { mockConversations } from "@/lib/mock/conversations";

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  searchQuery: string;
  setActiveConversation: (id: string) => void;
  setSearchQuery: (q: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  markAsRead: (conversationId: string) => void;
  totalUnread: () => number;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: mockConversations,
  activeConversationId: null,
  searchQuery: "",

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    get().markAsRead(id);
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

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

    // Simulate sent status after 400ms
    setTimeout(() => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newMsg.id ? { ...m, status: "sent" } : m
                ),
              }
            : c
        ),
      }));
    }, 400);

    // Simulate delivered after 1s
    setTimeout(() => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === newMsg.id ? { ...m, status: "delivered" } : m
                ),
              }
            : c
        ),
      }));
    }, 1000);
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
