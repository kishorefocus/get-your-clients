import { apiFetch } from "./client";

export interface PipelineStageResponse {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  position: number;
  color: string | null;
}

export interface PipelineStageCreateRequest {
  name: string;
  slug: string;
  position: number;
  color?: string;
}

export interface KanbanClientItem {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  rating: number | null;
  category?: string | null;
  priority?: "low" | "medium" | "high" | string;
  nextFollowUp?: string | null;
  assignedRep?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface KanbanColumnResponse {
  stage: PipelineStageResponse;
  clients: KanbanClientItem[];
}

export interface MoveClientStageRequest {
  client_id: string;
  stage_id: string;
}

export async function listStages(): Promise<PipelineStageResponse[]> {
  return apiFetch<PipelineStageResponse[]>("/api/v1/pipeline/stages");
}

export async function createStage(
  payload: PipelineStageCreateRequest
): Promise<PipelineStageResponse> {
  return apiFetch<PipelineStageResponse>("/api/v1/pipeline/stages", {
    method: "POST",
    body: payload,
  });
}

export async function getBoard(): Promise<KanbanColumnResponse[]> {
  return apiFetch<KanbanColumnResponse[]>("/api/v1/pipeline/board");
}

export async function moveClient(
  payload: MoveClientStageRequest
): Promise<void> {
  return apiFetch<void>("/api/v1/pipeline/move", {
    method: "POST",
    body: payload,
  });
}
