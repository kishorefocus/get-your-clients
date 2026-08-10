import { apiFetch } from "./client";

export interface InteractionCreateRequest {
  type: string;
  summary?: string;
  related_id?: string;
}

export interface InteractionResponse {
  id: string;
  org_id: string;
  client_id: string;
  user_id: string | null;
  type: string;
  summary: string | null;
  related_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InteractionListResponse {
  results: InteractionResponse[];
  next_cursor: string | null;
}

export async function listInteractions(
  clientId: string,
  cursor?: string,
  limit?: number
): Promise<InteractionListResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append("cursor", cursor);
  if (limit) params.append("limit", String(limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<InteractionListResponse>(`/api/v1/clients/${clientId}/interactions${query}`);
}

export async function createInteraction(
  clientId: string,
  payload: InteractionCreateRequest
): Promise<InteractionResponse> {
  return apiFetch<InteractionResponse>(`/api/v1/clients/${clientId}/interactions`, {
    method: "POST",
    body: payload,
  });
}
