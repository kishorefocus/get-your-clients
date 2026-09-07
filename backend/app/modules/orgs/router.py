import datetime
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm.attributes import flag_modified

from app.core.database import get_db
from app.core.security import hash_password
from app.modules.auth.dependencies import CurrentUser, require_role
from app.models.organization import Organization
from app.models.user import User
from app.models.invitation import Invitation
from app.schemas.auth import UserResponse
from app.schemas.organization import (
    InviteUserRequest,
    OrganizationResponse,
    OrgMemberResponse,
    GoogleMapsAutoConnectRequest,
    GoogleMapsManualKeyRequest,
    GoogleMapsIntegrationStatusResponse,
)
from app.modules.orgs.gcp_service import fetch_or_create_gcp_maps_key, validate_maps_api_key

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


@router.get("/integrations/google-maps", response_model=GoogleMapsIntegrationStatusResponse)
async def get_google_maps_status(
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    """Returns the current organization's Google Maps API integration status."""
    org = await db.get(Organization, current_user.org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    settings_dict = org.settings or {}
    key = settings_dict.get("google_maps_api_key")
    project_id = settings_dict.get("google_maps_project_id")
    last_connected_at = settings_dict.get("google_maps_connected_at")

    if key:
        masked = f"{key[:6]}...{key[-4:]}" if len(key) > 10 else "••••••••"
        return GoogleMapsIntegrationStatusResponse(
            connected=True,
            api_key_masked=masked,
            project_id=project_id,
            status="connected",
            message="Google Maps API is connected and active.",
            last_connected_at=last_connected_at,
        )

    return GoogleMapsIntegrationStatusResponse(
        connected=False,
        status="not_configured",
        message="No Google Maps API key configured for this organization.",
    )


@router.post("/integrations/google-maps/auto-connect", response_model=GoogleMapsIntegrationStatusResponse)
async def auto_connect_google_maps(
    payload: GoogleMapsAutoConnectRequest,
    current_user: CurrentUser = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
):
    """
    Automatically retrieves or creates a Google Maps API key from the user's
    authenticated Google Cloud account and saves it into the organization's settings.
    """
    org = await db.get(Organization, current_user.org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    result = await fetch_or_create_gcp_maps_key(payload.access_token)

    if result.get("status") == "connected" and result.get("api_key"):
        key = result["api_key"]
        project_id = result.get("project_id")
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        settings_dict = dict(org.settings or {})
        settings_dict["google_maps_api_key"] = key
        settings_dict["google_maps_project_id"] = project_id
        settings_dict["google_maps_connected_at"] = now_iso
        org.settings = settings_dict
        flag_modified(org, "settings")
        await db.commit()

        masked = f"{key[:6]}...{key[-4:]}" if len(key) > 10 else "••••••••"
        return GoogleMapsIntegrationStatusResponse(
            connected=True,
            api_key_masked=masked,
            project_id=project_id,
            status="connected",
            message=result.get("message") or "Successfully connected Google Maps API key!",
            last_connected_at=now_iso,
        )

    # If requires activation, no projects, or error
    return GoogleMapsIntegrationStatusResponse(
        connected=False,
        project_id=result.get("project_id"),
        status=result.get("status") or "error",
        message=result.get("message") or "Could not retrieve API key from Google Cloud.",
        console_url=result.get("console_url"),
    )


@router.post("/integrations/google-maps", response_model=GoogleMapsIntegrationStatusResponse)
async def save_google_maps_key(
    payload: GoogleMapsManualKeyRequest,
    current_user: CurrentUser = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
):
    """Manually saves and verifies a Google Maps API Key for the organization."""
    org = await db.get(Organization, current_user.org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    key = payload.api_key.strip()
    is_valid, reason = await validate_maps_api_key(key)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    settings_dict = dict(org.settings or {})
    settings_dict["google_maps_api_key"] = key
    settings_dict["google_maps_connected_at"] = now_iso
    org.settings = settings_dict
    flag_modified(org, "settings")
    await db.commit()

    masked = f"{key[:6]}...{key[-4:]}" if len(key) > 10 else "••••••••"
    return GoogleMapsIntegrationStatusResponse(
        connected=True,
        api_key_masked=masked,
        status="connected",
        message=f"Key verified and saved: {reason}",
        last_connected_at=now_iso,
    )


@router.delete("/integrations/google-maps", response_model=GoogleMapsIntegrationStatusResponse)
async def disconnect_google_maps(
    current_user: CurrentUser = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
):
    """Disconnects the organization's Google Maps API key."""
    org = await db.get(Organization, current_user.org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    settings_dict = dict(org.settings or {})
    settings_dict.pop("google_maps_api_key", None)
    settings_dict.pop("google_maps_project_id", None)
    settings_dict.pop("google_maps_connected_at", None)
    org.settings = settings_dict
    flag_modified(org, "settings")
    await db.commit()

    return GoogleMapsIntegrationStatusResponse(
        connected=False,
        status="not_configured",
        message="Google Maps API disconnected.",
    )

