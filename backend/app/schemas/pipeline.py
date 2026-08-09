import uuid

from pydantic import BaseModel, Field


class PipelineStageCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    position: int = 0
    is_terminal: bool = False


class PipelineStageResponse(BaseModel):
    id: uuid.UUID
    name: str
    position: int
    is_terminal: bool

    model_config = {"from_attributes": True}


class MoveClientStageRequest(BaseModel):
    client_id: uuid.UUID
    stage_id: uuid.UUID
    assigned_user_id: uuid.UUID | None = None


class KanbanColumnResponse(BaseModel):
    stage: PipelineStageResponse
    client_ids: list[uuid.UUID]
