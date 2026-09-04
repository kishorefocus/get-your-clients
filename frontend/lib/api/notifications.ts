import { apiFetch } from "./client";


export interface NotificationResponse {
  id: string;
  org_id: string;
  user_id: string;
  title: string;
  message: string;
  type: "welcome" | "tip" | "update";
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export async function listNotifications(): Promise<NotificationResponse[]> {
  return apiFetch<NotificationResponse[]>("/api/v1/notifications");
}

export async function readAllNotifications(): Promise<void> {
  return apiFetch<void>("/api/v1/notifications/read-all", {
    method: "POST",
  });
}

export async function readNotification(id: string): Promise<NotificationResponse> {
  return apiFetch<NotificationResponse>(`/api/v1/notifications/${id}/read`, {
    method: "POST",
  });
}
