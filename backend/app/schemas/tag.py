import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class TagCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class TagResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
