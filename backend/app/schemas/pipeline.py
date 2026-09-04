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


class KanbanClientItem(BaseModel):
    id: uuid.UUID
    name: str
    city: str | None = None
    country: str | None = None
    rating: float | None = None
    category: str | None = None
    priority: str = "medium"
    nextFollowUp: str | None = None
    assignedRep: str | None = None
    phone: str | None = None
    email: str | None = None

    model_config = {"from_attributes": True}


class KanbanColumnResponse(BaseModel):
    stage: PipelineStageResponse
    clients: list[KanbanClientItem]
