import { apiFetch } from "./client";

export interface IndustryResponse {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IndustryTreeNode {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  children: IndustryTreeNode[];
}

export interface IndustryCreateRequest {
  name: string;
  slug: string;
  parent_id?: string;
}

export async function listIndustries(parentId?: string): Promise<IndustryResponse[]> {
  const query = parentId ? `?parent_id=${parentId}` : "";
  return apiFetch<IndustryResponse[]>(`/api/v1/industries${query}`);
}

export async function getIndustryTree(): Promise<IndustryTreeNode[]> {
  return apiFetch<IndustryTreeNode[]>("/api/v1/industries/tree");
}

export async function createIndustry(payload: IndustryCreateRequest): Promise<IndustryResponse> {
  return apiFetch<IndustryResponse>("/api/v1/industries", {
    method: "POST",
    body: payload,
  });
}

export async function deleteIndustry(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/industries/${id}`, {
    method: "DELETE",
  });
}
