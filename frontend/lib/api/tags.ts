import { apiFetch } from "./client";

export interface TagCreateRequest {
  name: string;
}

export interface TagResponse {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export async function listTags(): Promise<TagResponse[]> {
  return apiFetch<TagResponse[]>("/api/v1/tags");
}

export async function createTag(payload: TagCreateRequest): Promise<TagResponse> {
  return apiFetch<TagResponse>("/api/v1/tags", {
    method: "POST",
    body: payload,
  });
}

export async function deleteTag(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/tags/${id}`, {
    method: "DELETE",
  });
}

export async function attachTag(clientId: string, tagId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/clients/${clientId}/tags/${tagId}`, {
    method: "POST",
  });
}

export async function detachTag(clientId: string, tagId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/clients/${clientId}/tags/${tagId}`, {
    method: "DELETE",
  });
}
