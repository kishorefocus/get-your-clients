import { apiFetch, apiFetchForm } from "./client";

export interface ClientResponse {
  id: string;
  org_id: string | null;
  name: string;
  industry_id: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  source: string;
  last_verified_at: string | null;
  consent_status: string;
  distance_meters: number | null;
  tags?: { id: string; name: string }[];
}

export interface ClientSearchRequest {
  keyword?: string;
  industry_id?: string;
  country?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  min_rating?: number;
  max_rating?: number;
  cursor?: string;
  limit?: number;
}

export interface ClientSearchResponse {
  results: ClientResponse[];
  next_cursor: string | null;
}

export interface ClientCreateRequest {
  name: string;
  industry_id?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  metadata?: Record<string, unknown>;
}

export interface ClientUpdateRequest {
  name?: string;
  industry_id?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  metadata?: Record<string, unknown>;
  consent_status?: string;
}

export async function searchClients(
  query: ClientSearchRequest
): Promise<ClientSearchResponse> {
  return apiFetch<ClientSearchResponse>("/api/v1/clients/search", {
    method: "POST",
    body: query,
  });
}

export async function getClient(id: string): Promise<ClientResponse> {
  return apiFetch<ClientResponse>(`/api/v1/clients/${id}`);
}

export async function createClient(
  payload: ClientCreateRequest
): Promise<ClientResponse> {
  return apiFetch<ClientResponse>("/api/v1/clients", {
    method: "POST",
    body: payload,
  });
}

export async function updateClient(
  id: string,
  payload: ClientUpdateRequest
): Promise<ClientResponse> {
  return apiFetch<ClientResponse>(`/api/v1/clients/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteClient(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/clients/${id}`, { method: "DELETE" });
}

export async function importClientsCsv(
  file: File
): Promise<{ task_id: string; status: string }> {
  const fd = new FormData();
  fd.append("file", file);
  return apiFetchForm("/api/v1/clients/import/csv", fd);
}
