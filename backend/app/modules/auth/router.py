import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_password, create_access_token, create_refresh_token
from app.modules.auth.dependencies import CurrentUser, get_current_user, get_user_from_refresh_token
from app.modules.auth.service import login, refresh, register_org
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterOrgRequest,
    TokenPairResponse,
    UserResponse,
    VerifyInvitationResponse,
    AcceptInvitationRequest,
)
from app.models.user import User
from app.models.invitation import Invitation
from app.models.organization import Organization

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenPairResponse, status_code=201)
async def register(payload: RegisterOrgRequest, db: AsyncSession = Depends(get_db)):
    """Creates a new Organization + its first (admin) User in one step."""
    return await register_org(db, payload)


@router.post("/login", response_model=TokenPairResponse)
async def login_route(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login(db, payload)


@router.post("/refresh", response_model=TokenPairResponse)
async def refresh_route(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    claims = get_user_from_refresh_token(payload.refresh_token)
    return await refresh(db, user_id=str(claims.user_id), org_id=str(claims.org_id))


@router.get("/me", response_model=UserResponse)
async def me(current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.id == current_user.user_id))
    return user


@router.get("/invite/verify", response_model=VerifyInvitationResponse)
async def verify_invite(token: str, db: AsyncSession = Depends(get_db)):
    now = datetime.datetime.now(datetime.timezone.utc)
    invitation = await db.scalar(
        select(Invitation).where(
            Invitation.token == token,
            Invitation.is_accepted == False,
            Invitation.expires_at > now
        )
    )
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation link is invalid or has expired"
        )
    
    org = await db.get(Organization, invitation.org_id)
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
        
    return VerifyInvitationResponse(
        email=invitation.email,
        org_name=org.name,
        full_name=invitation.full_name,
        role=invitation.role
    )


@router.post("/invite/accept", response_model=TokenPairResponse)
async def accept_invite(payload: AcceptInvitationRequest, db: AsyncSession = Depends(get_db)):
    now = datetime.datetime.now(datetime.timezone.utc)
    invitation = await db.scalar(
        select(Invitation).where(
            Invitation.token == payload.token,
            Invitation.is_accepted == False,
            Invitation.expires_at > now
        )
    )
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation link is invalid or has expired"
        )

    # Re-verify email is not registered
    existing_user = await db.scalar(select(User).where(User.email == invitation.email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email is already registered"
        )

    # Create user
    user = User(
        org_id=invitation.org_id,
        email=invitation.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name or invitation.full_name,
        role=invitation.role,
        is_active=True
    )
    db.add(user)
    
    # Mark invitation accepted
    invitation.is_accepted = True
    
    await db.commit()
    await db.refresh(user)

    # Return access/refresh tokens to log user in immediately
    return TokenPairResponse(
        access_token=create_access_token(user_id=str(user.id), org_id=str(user.org_id), role=user.role),
        refresh_token=create_refresh_token(user_id=str(user.id), org_id=str(user.org_id), role=user.role),
    )
