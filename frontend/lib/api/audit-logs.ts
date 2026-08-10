import { apiFetch } from "./client";

export interface AuditLogResponse {
  id: string;
  org_id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  context: Record<string, any>;
  created_at: string;
}

export interface AuditLogListResponse {
  results: AuditLogResponse[];
  total: number;
}

export interface AuditLogFilters {
  action?: string;
  resource_type?: string;
  resource_id?: string;
  limit?: number;
  offset?: number;
}

export async function listAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
  const params = new URLSearchParams();
  if (filters.action) params.append("action", filters.action);
  if (filters.resource_type) params.append("resource_type", filters.resource_type);
  if (filters.resource_id) params.append("resource_id", filters.resource_id);
  if (filters.limit) params.append("limit", String(filters.limit));
  if (filters.offset) params.append("offset", String(filters.offset));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<AuditLogListResponse>(`/api/v1/audit-logs${query}`);
}
