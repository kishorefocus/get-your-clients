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
