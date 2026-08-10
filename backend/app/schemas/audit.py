import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    user_id: uuid.UUID | None
    action: str
    resource_type: str
    resource_id: uuid.UUID | None
    context: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    results: list[AuditLogResponse]
    total: int
