import uuid

from pydantic import BaseModel, EmailStr, Field


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    plan: str
    country: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str = Field(pattern="^(admin|manager|rep)$")
    full_name: str | None = None
