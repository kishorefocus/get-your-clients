import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SubscriptionResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    plan: str
    status: str
    current_period_end: datetime | None = None
    checkout_url: str | None = None

    model_config = {"from_attributes": True}



class SubscribeRequest(BaseModel):
    plan: str = Field(pattern="^(free|pro|enterprise)$")
