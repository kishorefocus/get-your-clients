import { apiFetch } from "./client";

export interface ReminderCreateRequest {
  title: string;
  notes?: string;
  due_at: string;
  client_id?: string;
}

export interface ReminderUpdateRequest {
  title?: string;
  notes?: string;
  due_at?: string;
  client_id?: string;
  is_done?: boolean;
}

export interface ReminderResponse {
  id: string;
  org_id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  notes: string | null;
  due_at: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export async function listReminders(dueSoon?: boolean): Promise<ReminderResponse[]> {
  const query = dueSoon ? "?due_soon=true" : "";
  return apiFetch<ReminderResponse[]>(`/api/v1/reminders${query}`);
}

export async function createReminder(
  payload: ReminderCreateRequest
): Promise<ReminderResponse> {
  return apiFetch<ReminderResponse>("/api/v1/reminders", {
    method: "POST",
    body: payload,
  });
}

export async function updateReminder(
  id: string,
  payload: ReminderUpdateRequest
): Promise<ReminderResponse> {
  return apiFetch<ReminderResponse>(`/api/v1/reminders/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteReminder(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/reminders/${id}`, {
    method: "DELETE",
  });
}
