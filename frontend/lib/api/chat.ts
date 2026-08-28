import { apiFetch } from "./client";
import { Conversation } from "@/types";

export interface MessageResponse {
  id: string;
  thread_id: string;
  sender_user_id: string | null;
  body: string;
  status: string;
  created_at: string;
}

export async function getOrCreateThread(
  clientId: string
): Promise<{ thread_id: string }> {
  return apiFetch<{ thread_id: string }>(
    `/api/v1/chat/threads/by-client/${clientId}`,
    { method: "POST" }
  );
}

export async function getMessageHistory(
  threadId: string
): Promise<MessageResponse[]> {
  return apiFetch<MessageResponse[]>(
    `/api/v1/chat/threads/${threadId}/messages`
  );
}

export async function listConversations(): Promise<Conversation[]> {
  return apiFetch<Conversation[]>("/api/v1/chat/threads");
}
