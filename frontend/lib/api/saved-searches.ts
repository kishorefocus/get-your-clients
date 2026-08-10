import { apiFetch } from "./client";

export interface SavedSearchCreateRequest {
  name: string;
  query: Record<string, any>;
}

export interface SavedSearchUpdateRequest {
  name?: string;
  query?: Record<string, any>;
}

export interface SavedSearchResponse {
  id: string;
  org_id: string;
  user_id: string;
  name: string;
  query: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function listSavedSearches(): Promise<SavedSearchResponse[]> {
  return apiFetch<SavedSearchResponse[]>("/api/v1/saved-searches");
}

export async function createSavedSearch(
  payload: SavedSearchCreateRequest
): Promise<SavedSearchResponse> {
  return apiFetch<SavedSearchResponse>("/api/v1/saved-searches", {
    method: "POST",
    body: payload,
  });
}

export async function updateSavedSearch(
  id: string,
  payload: SavedSearchUpdateRequest
): Promise<SavedSearchResponse> {
  return apiFetch<SavedSearchResponse>(`/api/v1/saved-searches/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteSavedSearch(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/saved-searches/${id}`, {
    method: "DELETE",
  });
}
