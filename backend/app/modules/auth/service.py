from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterOrgRequest, TokenPairResponse


async def register_org(db: AsyncSession, payload: RegisterOrgRequest) -> TokenPairResponse:
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    org = Organization(name=payload.org_name, country=payload.org_country)
    db.add(org)
    await db.flush()  # need org.id before creating the user

    user = User(
        org_id=org.id,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=UserRole.ADMIN.value,  # first user of a new org is always admin
    )
    db.add(user)
    await db.commit()

    return TokenPairResponse(
        access_token=create_access_token(user_id=str(user.id), org_id=str(org.id), role=user.role),
        refresh_token=create_refresh_token(user_id=str(user.id), org_id=str(org.id), role=user.role),
    )


async def login(db: AsyncSession, payload: LoginRequest) -> TokenPairResponse:
    user = await db.scalar(select(User).where(User.email == payload.email))
    if user is None or user.hashed_password is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    return TokenPairResponse(
        access_token=create_access_token(user_id=str(user.id), org_id=str(user.org_id), role=user.role),
        refresh_token=create_refresh_token(user_id=str(user.id), org_id=str(user.org_id), role=user.role),
    )


async def refresh(db: AsyncSession, user_id: str, org_id: str) -> TokenPairResponse:
    """Re-issues an access token; re-checks is_active so a deactivated user's refresh token stops working."""
    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer active")

    return TokenPairResponse(
        access_token=create_access_token(user_id=str(user.id), org_id=org_id, role=user.role),
        refresh_token=create_refresh_token(user_id=str(user.id), org_id=org_id, role=user.role),
    )
