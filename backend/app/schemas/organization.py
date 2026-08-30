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


class OrgMemberResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    email: EmailStr
    full_name: str | None
    role: str
    is_active: bool
    status: str  # "active" or "invited"
    token: str | None = None

    model_config = {"from_attributes": True}

