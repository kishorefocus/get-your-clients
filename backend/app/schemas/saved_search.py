import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SavedSearchCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    # Serialised ClientSearchRequest — stored as-is and replayed on execute
    query: dict


class SavedSearchUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    query: dict | None = None


class SavedSearchResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    user_id: uuid.UUID
    name: str
    query: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
