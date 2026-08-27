import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user, require_role
from app.models.subscription import Subscription
from app.models.organization import Organization
from app.schemas.subscription import SubscriptionResponse, SubscribeRequest

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])


@router.get("/status", response_model=SubscriptionResponse)
async def get_subscription_status(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch subscription for the user's organization
    stmt = select(Subscription).where(Subscription.org_id == current_user.org_id)
    sub = await db.scalar(stmt)

    if sub is None:
        # Create a default free subscription if it doesn't exist
        sub = Subscription(
            org_id=current_user.org_id,
            plan="free",
            status="active",
            current_period_end=None,
        )
        db.add(sub)
        await db.commit()
        await db.refresh(sub)

    return sub


@router.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe(
    payload: SubscribeRequest,
    current_user: CurrentUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    org = await db.get(Organization, current_user.org_id)
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    # Fetch or create subscription
    stmt = select(Subscription).where(Subscription.org_id == current_user.org_id)
    sub = await db.scalar(stmt)

    # Set period end to 30 days from now for active plans
    period_end = datetime.now(timezone.utc) + timedelta(days=30) if payload.plan != "free" else None

    if sub is None:
        sub = Subscription(
            org_id=current_user.org_id,
            plan=payload.plan,
            status="active",
            current_period_end=period_end,
        )
        db.add(sub)
    else:
        sub.plan = payload.plan
        sub.status = "active"
        sub.current_period_end = period_end
        sub.updated_at = datetime.now(timezone.utc)

    # Also update organization.plan directly for backwards compatibility and ease of check
    org.plan = payload.plan
    org.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(sub)
    return sub


@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    current_user: CurrentUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    org = await db.get(Organization, current_user.org_id)
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    stmt = select(Subscription).where(Subscription.org_id == current_user.org_id)
    sub = await db.scalar(stmt)

    if sub is None:
        sub = Subscription(
            org_id=current_user.org_id,
            plan="free",
            status="active",
            current_period_end=None,
        )
        db.add(sub)
    else:
        sub.plan = "free"
        sub.status = "active"
        sub.current_period_end = None
        sub.updated_at = datetime.now(timezone.utc)

    org.plan = "free"
    org.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(sub)
    return sub
