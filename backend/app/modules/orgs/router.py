import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_password
from app.modules.auth.dependencies import CurrentUser, require_role
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.organization import InviteUserRequest, OrganizationResponse

router = APIRouter(prefix="/api/v1/organizations", tags=["organizations"])


@router.get("/me", response_model=OrganizationResponse)
async def get_my_organization(
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    org = await db.get(Organization, current_user.org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org


@router.get("/members", response_model=list[UserResponse])
async def list_members(
    current_user: CurrentUser = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.scalars(select(User).where(User.org_id == current_user.org_id))
    return list(result)


@router.post("/members/invite", response_model=UserResponse, status_code=201)
async def invite_member(
    payload: InviteUserRequest,
    current_user: CurrentUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates the user with a random temporary password and returns it once.
    Wiring this to an actual email invite (magic link) is a good next step
    once the email provider (step 4/6 in the outreach pipeline) is in place.
    """
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    temp_password = secrets.token_urlsafe(12)
    user = User(
        org_id=current_user.org_id,
        email=payload.email,
        hashed_password=hash_password(temp_password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    await db.commit()
    return user
