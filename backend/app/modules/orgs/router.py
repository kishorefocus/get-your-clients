import datetime
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_password
from app.modules.auth.dependencies import CurrentUser, require_role
from app.models.organization import Organization
from app.models.user import User
from app.models.invitation import Invitation
from app.schemas.auth import UserResponse
from app.schemas.organization import InviteUserRequest, OrganizationResponse, OrgMemberResponse

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


@router.get("/members", response_model=list[OrgMemberResponse])
async def list_members(
    current_user: CurrentUser = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
):
    # Fetch registered users
    users_result = await db.scalars(select(User).where(User.org_id == current_user.org_id))
    members = [
        OrgMemberResponse(
            id=u.id,
            org_id=u.org_id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            status="active"
        )
        for u in users_result
    ]

    # Fetch pending/unexpired invitations
    now = datetime.datetime.now(datetime.timezone.utc)
    invites_result = await db.scalars(
        select(Invitation).where(
            Invitation.org_id == current_user.org_id,
            Invitation.is_accepted == False,
            Invitation.expires_at > now
        )
    )
    for inv in invites_result:
        members.append(
            OrgMemberResponse(
                id=inv.id,
                org_id=inv.org_id,
                email=inv.email,
                full_name=inv.full_name,
                role=inv.role,
                is_active=False,
                status="invited",
                token=inv.token
            )
        )

    return members


@router.post("/members/invite", response_model=OrgMemberResponse, status_code=201)
async def invite_member(
    payload: InviteUserRequest,
    current_user: CurrentUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates an invitation token for onboarding a new member.
    Log the URL so that developers can test onboarding locally.
    """
    # Check if user already exists
    existing_user = await db.scalar(select(User).where(User.email == payload.email))
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Check for an active pending invitation
    now = datetime.datetime.now(datetime.timezone.utc)
    existing_invite = await db.scalar(
        select(Invitation).where(
            Invitation.email == payload.email,
            Invitation.is_accepted == False,
            Invitation.expires_at > now
        )
    )
    if existing_invite is not None:
        # Re-use or update expiry
        existing_invite.expires_at = now + datetime.timedelta(hours=48)
        await db.commit()
        await db.refresh(existing_invite)
        invitation = existing_invite
    else:
        # Create a new invitation
        token = secrets.token_urlsafe(32)
        invitation = Invitation(
            org_id=current_user.org_id,
            email=payload.email,
            role=payload.role,
            full_name=payload.full_name,
            token=token,
            expires_at=now + datetime.timedelta(hours=48),
        )
        db.add(invitation)
        await db.commit()
        await db.refresh(invitation)

    # Print the invite URL to console for local testing
    invite_url = f"http://localhost:3000/onboard?token={invitation.token}"
    print(f"\n[INVITE URL LOG] User invited to Org: {invite_url}\n")

    return OrgMemberResponse(
        id=invitation.id,
        org_id=invitation.org_id,
        email=invitation.email,
        full_name=invitation.full_name,
        role=invitation.role,
        is_active=False,
        status="invited",
        token=invitation.token,
    )
