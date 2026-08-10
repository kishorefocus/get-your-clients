import { apiFetch } from "./client";

export interface ContactCreateRequest {
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  consent_status?: string;
}

export interface ContactUpdateRequest {
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
  consent_status?: string;
  opt_out?: boolean;
}

export interface ContactResponse {
  id: string;
  client_id: string;
  name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  consent_status: string;
  opt_out_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listContacts(clientId: string): Promise<ContactResponse[]> {
  return apiFetch<ContactResponse[]>(`/api/v1/clients/${clientId}/contacts`);
}

export async function createContact(
  clientId: string,
  payload: ContactCreateRequest
): Promise<ContactResponse> {
  return apiFetch<ContactResponse>(`/api/v1/clients/${clientId}/contacts`, {
    method: "POST",
    body: payload,
  });
}

export async function getContact(
  clientId: string,
  contactId: string
): Promise<ContactResponse> {
  return apiFetch<ContactResponse>(`/api/v1/clients/${clientId}/contacts/${contactId}`);
}

export async function updateContact(
  clientId: string,
  contactId: string,
  payload: ContactUpdateRequest
): Promise<ContactResponse> {
  return apiFetch<ContactResponse>(`/api/v1/clients/${clientId}/contacts/${contactId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteContact(
  clientId: string,
  contactId: string
): Promise<void> {
  return apiFetch<void>(`/api/v1/clients/${clientId}/contacts/${contactId}`, {
    method: "DELETE",
  });
}
