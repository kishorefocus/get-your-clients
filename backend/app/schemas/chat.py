import uuid
from datetime import datetime

from pydantic import BaseModel


class MessageCreate(BaseModel):
    body: str


class MessageResponse(BaseModel):
    id: uuid.UUID
    thread_id: uuid.UUID
    sender_user_id: uuid.UUID | None
    body: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class WebSocketEvent(BaseModel):
    """Envelope for every frame sent over /ws/chat/{thread_id}."""

    event: str  # "message.new" | "message.read" | "typing" | "error"
    data: dict
