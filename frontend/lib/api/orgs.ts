import { apiFetch } from "./client";

export interface OrganizationResponse {
  id: string;
  name: string;
  plan: string;
  country: string | null;
  created_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  status?: string;
  token?: string;
}

export interface InviteUserRequest {
  email: string;
  full_name?: string;
  role: "rep" | "manager" | "admin";
}

export async function getMyOrg(): Promise<OrganizationResponse> {
  return apiFetch<OrganizationResponse>("/api/v1/organizations/me");
}

export async function listMembers(): Promise<OrgMember[]> {
  return apiFetch<OrgMember[]>("/api/v1/organizations/members");
}

export async function inviteMember(
  payload: InviteUserRequest
): Promise<OrgMember> {
  return apiFetch<OrgMember>("/api/v1/organizations/members/invite", {
    method: "POST",
    body: payload,
  });
}

export interface GoogleMapsIntegrationStatusResponse {
  connected: boolean;
  api_key_masked?: string | null;
  project_id?: string | null;
  status: "connected" | "not_configured" | "no_projects" | "requires_activation" | "error";
  message?: string | null;
  console_url?: string | null;
  last_connected_at?: string | null;
}

export async function getGoogleMapsStatus(): Promise<GoogleMapsIntegrationStatusResponse> {
  return apiFetch<GoogleMapsIntegrationStatusResponse>("/api/v1/organizations/integrations/google-maps");
}

export async function autoConnectGoogleMaps(accessToken: string): Promise<GoogleMapsIntegrationStatusResponse> {
  return apiFetch<GoogleMapsIntegrationStatusResponse>("/api/v1/organizations/integrations/google-maps/auto-connect", {
    method: "POST",
    body: { access_token: accessToken },
  });
}

export async function saveGoogleMapsKey(apiKey: string): Promise<GoogleMapsIntegrationStatusResponse> {
  return apiFetch<GoogleMapsIntegrationStatusResponse>("/api/v1/organizations/integrations/google-maps", {
    method: "POST",
    body: { api_key: apiKey },
  });
}

export async function disconnectGoogleMaps(): Promise<GoogleMapsIntegrationStatusResponse> {
  return apiFetch<GoogleMapsIntegrationStatusResponse>("/api/v1/organizations/integrations/google-maps", {
    method: "DELETE",
  });
}

