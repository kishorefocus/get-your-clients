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
