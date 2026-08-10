import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ReminderCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    notes: str | None = None
    due_at: datetime
    client_id: uuid.UUID | None = None  # optional link to a client


class ReminderUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    notes: str | None = None
    due_at: datetime | None = None
    client_id: uuid.UUID | None = None
    is_done: bool | None = None


class ReminderResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    user_id: uuid.UUID
    client_id: uuid.UUID | None
    title: str
    notes: str | None
    due_at: datetime
    is_done: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
