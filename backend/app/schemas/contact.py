import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ContactCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    title: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=320)
    consent_status: str = "unknown"


class ContactUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    title: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=320)
    consent_status: str | None = None
    opt_out: bool | None = None  # set True → stamps opt_out_at, False → clears it


class ContactResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    name: str
    title: str | None
    phone: str | None
    email: str | None
    consent_status: str
    opt_out_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
