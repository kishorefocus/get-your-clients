from typing import Any
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
from app.models.pipeline import PipelineStage
from app.schemas.auth import (
    LoginRequest,
    RegisterOrgRequest,
    TokenPairResponse,
    GoogleAuthRequest,
    GoogleAuthResponse,
)


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

    # Seed default pipeline stages
    stage_definitions = [
        ("New", 0, False),
        ("Contacted", 1, False),
        ("Responded", 2, False),
        ("Negotiating", 3, False),
        ("Won", 4, True),
        ("Lost", 5, True),
    ]
    for name, pos, is_term in stage_definitions:
        stage = PipelineStage(org_id=org.id, name=name, position=pos, is_terminal=is_term)
        db.add(stage)

    # Seed a support contact, thread, and unread welcome message
    from app.models.client import Client
    from app.models.message import Message, MessageThread

    support_client = Client(
        org_id=org.id,
        name="GlobalReach Support",
        email="support@globalreach.io",
        phone="+1 (555) 019-9000",
        website="https://globalreach.io",
        address="100 Pine Street, San Francisco, CA 94111",
        city="San Francisco",
        country="US",
        latitude=37.79,
        longitude=-122.40,
        rating=5.0,
        source="system",
        consent_status="granted"
    )
    db.add(support_client)
    await db.flush()

    thread = MessageThread(
        org_id=org.id,
        client_id=support_client.id,
        is_archived=False
    )
    db.add(thread)
    await db.flush()

    welcome_msg = Message(
        thread_id=thread.id,
        sender_user_id=None,
        body="Welcome to GlobalReach! We're thrilled to have you on board. Start discovering leads, claiming them to your pipeline, and scheduling outreach to grow your client base. If you need any assistance, we're here to help!",
        status="sent"
    )
    db.add(welcome_msg)

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


async def verify_google_identity(credential: str | None, access_token: str | None) -> dict:
    """
    Verifies a Google ID token (JWT) or access token using Google's verification APIs.
    Returns dict containing email, name, sub.
    """
    import httpx
    from app.core.config import settings

    # Development simulation fallback
    if settings.environment in ("local", "dev", "development") and (
        (credential and credential.startswith("dev_mock_")) or (access_token and access_token.startswith("dev_mock_"))
    ):
        return {
            "email": "dev.user@globalreach.io",
            "name": "Google Dev User",
            "sub": "dev_mock_google_sub_123",
        }

    # 1. If ID token (credential) is supplied
    if credential:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}")
                if res.status_code == 200:
                    data = res.json()
                    email = data.get("email")
                    if email:
                        return {
                            "email": email.lower(),
                            "name": data.get("name") or email.split("@")[0],
                            "sub": data.get("sub"),
                        }
        except Exception as exc:
            pass

    # 2. If access_token is supplied
    if access_token:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if res.status_code == 200:
                    data = res.json()
                    email = data.get("email")
                    if email:
                        return {
                            "email": email.lower(),
                            "name": data.get("name") or email.split("@")[0],
                            "sub": data.get("sub"),
                        }
        except Exception as exc:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to verify Google authentication credentials. Please try signing in again.",
    )


async def google_login_or_register(db: AsyncSession, payload) -> Any:
    """
    Authenticates a user via Google OAuth.
    If the user does not exist, registers a new organization or accepts an invitation,
    and returns tokens alongside integration status.
    """
    from datetime import datetime, timezone
    from app.models.invitation import Invitation
    from app.schemas.auth import GoogleAuthResponse

    google_data = await verify_google_identity(payload.credential, payload.access_token)
    email = google_data["email"]
    name = google_data.get("name")

    # Check if user already exists
    user = await db.scalar(select(User).where(User.email == email))

    if user is not None:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

        if not user.full_name and name:
            user.full_name = name
            await db.commit()

        org = await db.get(Organization, user.org_id)
        has_maps_key = bool(org and org.settings and org.settings.get("google_maps_api_key"))

        return GoogleAuthResponse(
            access_token=create_access_token(user_id=str(user.id), org_id=str(user.org_id), role=user.role),
            refresh_token=create_refresh_token(user_id=str(user.id), org_id=str(user.org_id), role=user.role),
            is_new_user=False,
            has_maps_key=has_maps_key,
            email=user.email,
            full_name=user.full_name,
        )

    # User does not exist -> Create account
    now = datetime.now(timezone.utc)
    invitation = await db.scalar(
        select(Invitation).where(
            Invitation.email == email,
            Invitation.is_accepted == False,
            Invitation.expires_at > now,
        )
    )

    if invitation is not None:
        org_id = invitation.org_id
        role = invitation.role
        full_name = payload.full_name or invitation.full_name or name
        invitation.is_accepted = True
    else:
        org_name = payload.org_name or (f"{name}'s Workspace" if name else "My Workspace")
        org = Organization(name=org_name, settings={})
        db.add(org)
        await db.flush()
        org_id = org.id
        role = UserRole.ADMIN.value
        full_name = name

        # Seed pipeline stages
        stage_definitions = [
            ("New", 0, False),
            ("Contacted", 1, False),
            ("Responded", 2, False),
            ("Negotiating", 3, False),
            ("Won", 4, True),
            ("Lost", 5, True),
        ]
        for s_name, pos, is_term in stage_definitions:
            stage = PipelineStage(org_id=org.id, name=s_name, position=pos, is_terminal=is_term)
            db.add(stage)

        # Seed welcome thread
        from app.models.client import Client
        from app.models.message import Message, MessageThread

        support_client = Client(
            org_id=org.id,
            name="GlobalReach Support",
            email="support@globalreach.io",
            phone="+1 (555) 019-9000",
            website="https://globalreach.io",
            address="100 Pine Street, San Francisco, CA 94111",
            city="San Francisco",
            country="US",
            latitude=37.79,
            longitude=-122.40,
            rating=5.0,
            source="system",
            consent_status="granted",
        )
        db.add(support_client)
        await db.flush()

        thread = MessageThread(
            org_id=org.id,
            client_id=support_client.id,
            is_archived=False,
        )
        db.add(thread)
        await db.flush()

        welcome_msg = Message(
            thread_id=thread.id,
            sender_user_id=None,
            body="Welcome to GlobalReach! We're thrilled to have you on board. Connect your Google Maps free tier API key to enable live place search and interactive mapping.",
            status="sent",
        )
        db.add(welcome_msg)

    new_user = User(
        org_id=org_id,
        email=email,
        hashed_password=None,
        auth_provider="google",
        full_name=full_name,
        role=role,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return GoogleAuthResponse(
        access_token=create_access_token(user_id=str(new_user.id), org_id=str(org_id), role=role),
        refresh_token=create_refresh_token(user_id=str(new_user.id), org_id=str(org_id), role=role),
        is_new_user=True,
        has_maps_key=False,
        email=new_user.email,
        full_name=new_user.full_name,
    )

