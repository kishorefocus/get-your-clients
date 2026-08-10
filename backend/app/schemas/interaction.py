import uuid
from datetime import datetime

from pydantic import BaseModel, Field

# Valid values mirror InteractionType StrEnum in models/interaction.py
VALID_TYPES = {"call", "email", "sms", "chat_message", "note"}


class InteractionCreateRequest(BaseModel):
    type: str = Field(description="One of: call, email, sms, chat_message, note")
    summary: str | None = Field(default=None, max_length=2000)
    related_id: uuid.UUID | None = None  # id of a Call or Message row, if applicable

    def model_post_init(self, __context):  # noqa: D102
        if self.type not in VALID_TYPES:
            raise ValueError(f"type must be one of {sorted(VALID_TYPES)}")


class InteractionResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    client_id: uuid.UUID
    user_id: uuid.UUID | None
    type: str
    summary: str | None
    related_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InteractionListResponse(BaseModel):
    results: list[InteractionResponse]
    next_cursor: str | None
