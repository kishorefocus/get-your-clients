import { apiFetch } from "./client";
import { CallLog } from "@/types";

export interface CallCreateRequest {
  client_id: string;
  duration_seconds: number;
  outcome: string;
}

export async function listCalls(): Promise<CallLog[]> {
  const data = await apiFetch<any[]>("/api/v1/calls");
  return data.map((c) => ({
    id: c.id,
    leadId: c.client_id,
    leadName: c.lead_name,
    leadPhone: c.lead_phone || "—",
    leadCountry: c.lead_country || "—",
    direction: "outbound",
    outcome: c.outcome,
    durationSecs: c.duration_seconds || 0,
    timestamp: c.created_at,
    hasRecording: !!c.recording_url,
    assignedRep: c.assigned_rep || "Rep",
  }));
}

export async function createCall(payload: CallCreateRequest): Promise<CallLog> {
  const c = await apiFetch<any>("/api/v1/calls", {
    method: "POST",
    body: payload,
  });
  return {
    id: c.id,
    leadId: c.client_id,
    leadName: c.lead_name,
    leadPhone: c.lead_phone || "—",
    leadCountry: c.lead_country || "—",
    direction: "outbound",
    outcome: c.outcome,
    durationSecs: c.duration_seconds || 0,
    timestamp: c.created_at,
    hasRecording: !!c.recording_url,
    assignedRep: c.assigned_rep || "Rep",
  };
}
