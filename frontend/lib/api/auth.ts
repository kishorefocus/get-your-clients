import { apiFetch, setTokens, clearTokens } from "./client";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

export interface RegisterRequest {
  org_name: string;
  org_country?: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export async function register(payload: RegisterRequest): Promise<TokenPair> {
  const data = await apiFetch<TokenPair>("/api/v1/auth/register", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function login(payload: LoginRequest): Promise<TokenPair> {
  const data = await apiFetch<TokenPair>("/api/v1/auth/login", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function me(): Promise<UserResponse> {
  return apiFetch<UserResponse>("/api/v1/auth/me");
}

export function logout() {
  clearTokens();
}

export interface VerifyInvitationResponse {
  email: string;
  org_name: string;
  full_name: string | null;
  role: string;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
  full_name?: string;
}

export async function verifyInviteToken(token: string): Promise<VerifyInvitationResponse> {
  return apiFetch<VerifyInvitationResponse>(
    `/api/v1/auth/invite/verify?token=${encodeURIComponent(token)}`,
    { skipAuth: true }
  );
}

export async function acceptInvite(payload: AcceptInvitationRequest): Promise<TokenPair> {
  const data = await apiFetch<TokenPair>("/api/v1/auth/invite/accept", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}
