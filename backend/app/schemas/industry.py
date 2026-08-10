import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class IndustryCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255, pattern=r"^[a-z0-9-]+$")
    parent_id: uuid.UUID | None = None


class IndustryResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    parent_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IndustryTreeNode(BaseModel):
    """Recursive tree node — each node embeds its direct children."""

    id: uuid.UUID
    name: str
    slug: str
    parent_id: uuid.UUID | None
    children: list["IndustryTreeNode"] = []

    model_config = {"from_attributes": True}


# Required for self-referential model
IndustryTreeNode.model_rebuild()
