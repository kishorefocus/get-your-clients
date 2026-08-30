import uuid

from pydantic import BaseModel, EmailStr, Field


class RegisterOrgRequest(BaseModel):
    """First user of a brand new org is always created as admin."""

    org_name: str = Field(min_length=1, max_length=255)
    org_country: str | None = Field(default=None, min_length=2, max_length=2)
    email: EmailStr
    password: str = Field(min_length=8, max_length=255)
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    email: EmailStr
    full_name: str | None
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class VerifyInvitationResponse(BaseModel):
    email: EmailStr
    org_name: str
    full_name: str | None
    role: str


class AcceptInvitationRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=255)
    full_name: str | None = None

