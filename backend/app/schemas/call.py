import uuid
from datetime import datetime
from pydantic import BaseModel

class CallCreateRequest(BaseModel):
    client_id: uuid.UUID
    duration_seconds: int
    recording_url: str | None = None
    outcome: str

class CallResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    client_id: uuid.UUID
    user_id: uuid.UUID | None
    provider_call_sid: str | None
    duration_seconds: int | None
    recording_url: str | None
    outcome: str | None
    created_at: datetime

    lead_name: str | None = None
    lead_phone: str | None = None
    lead_country: str | None = None
    assigned_rep: str | None = None

    model_config = {"from_attributes": True}
