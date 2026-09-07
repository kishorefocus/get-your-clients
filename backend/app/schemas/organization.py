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


class GoogleMapsAutoConnectRequest(BaseModel):
    access_token: str  # Google OAuth token with https://www.googleapis.com/auth/cloud-platform


class GoogleMapsManualKeyRequest(BaseModel):
    api_key: str


class GoogleMapsIntegrationStatusResponse(BaseModel):
    connected: bool
    api_key_masked: str | None = None
    project_id: str | None = None
    status: str = "not_configured"  # "connected", "not_configured", "no_projects", "requires_activation", "error"
    message: str | None = None
    console_url: str | None = None
    last_connected_at: str | None = None


