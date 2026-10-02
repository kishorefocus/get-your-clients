import uuid
import hmac
import hashlib
from datetime import datetime, timedelta, timezone

import logging
import razorpay
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from app.core.config import settings
from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user, require_role
from app.models.subscription import Subscription
from app.models.organization import Organization
from app.schemas.subscription import SubscriptionResponse, SubscribeRequest

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])

# ---------------------------------------------------------------------------
# Razorpay client helper
# ---------------------------------------------------------------------------

def _get_razorpay_client() -> razorpay.Client:
    """Return an authenticated Razorpay client. Raises if keys are missing."""
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay is not configured on this server.",
        )
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _fulfill_subscription(
    db: AsyncSession,
    org_id: uuid.UUID,
    user_id: uuid.UUID | None,
    plan: str,
    razorpay_payment_id: str | None,
    razorpay_order_id: str | None,
    billing_interval: str,
    current_period_end: datetime | None = None,
):
    """Upsert a Subscription row and update the parent Organization plan."""
    org = await db.get(Organization, org_id)
    if not org:
        return

    stmt = select(Subscription).where(Subscription.org_id == org_id)
    sub = await db.scalar(stmt)

    if current_period_end is None:
        days = 365 if billing_interval == "year" else 30
        current_period_end = datetime.now(timezone.utc) + timedelta(days=days)

    if sub is None:
        sub = Subscription(
            org_id=org_id,
            plan=plan,
            status="active",
            current_period_end=current_period_end,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_order_id=razorpay_order_id,
            billing_interval=billing_interval,
        )
        db.add(sub)
    else:
        sub.plan = plan
        sub.status = "active"
        sub.current_period_end = current_period_end
        sub.razorpay_payment_id = razorpay_payment_id
        if razorpay_order_id:
            sub.razorpay_order_id = razorpay_order_id
        sub.billing_interval = billing_interval
        sub.updated_at = datetime.now(timezone.utc)

    org.plan = plan
    org.updated_at = datetime.now(timezone.utc)

    from app.core.audit import record
    await record(
        db,
        org_id=org_id,
        user_id=user_id,
        action="subscribe",
        resource_type="subscription",
        resource_id=sub.id,
        context={"plan": plan, "razorpay_payment_id": razorpay_payment_id},
    )

    await db.commit()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/status", response_model=SubscriptionResponse)
async def get_subscription_status(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the current subscription for the user's organisation."""
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
        await db.commit()
        await db.refresh(sub)

    return sub


@router.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe(
    payload: SubscribeRequest,
    current_user: CurrentUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Downgrade to the free plan (cancels active subscription).
    Paid plan checkouts are initiated client-side via Razorpay checkout.
    """
    org = await db.get(Organization, current_user.org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    stmt = select(Subscription).where(Subscription.org_id == current_user.org_id)
    sub = await db.scalar(stmt)

    if payload.plan == "free":
        if sub is None:
            sub = Subscription(
                org_id=current_user.org_id,
                plan="free",
                status="active",
                current_period_end=None,
                razorpay_payment_id=None,
                razorpay_order_id=None,
            )
            db.add(sub)
        else:
            sub.plan = "free"
            sub.status = "active"
            sub.current_period_end = None
            sub.razorpay_payment_id = None
            sub.razorpay_order_id = None
            sub.updated_at = datetime.now(timezone.utc)

        org.plan = "free"
        org.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(sub)
        return sub

    # Paid plan checkouts are initiated on the client with the Razorpay JS SDK.
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Paid plan checkouts must be initiated via the client-side Razorpay checkout.",
    )


@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    current_user: CurrentUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Cancel the current subscription and revert the org to the free plan."""
    org = await db.get(Organization, current_user.org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    stmt = select(Subscription).where(Subscription.org_id == current_user.org_id)
    sub = await db.scalar(stmt)

    if sub is None:
        sub = Subscription(
            org_id=current_user.org_id,
            plan="free",
            status="active",
            current_period_end=None,
            razorpay_payment_id=None,
            razorpay_order_id=None,
        )
        db.add(sub)
    else:
        sub.plan = "free"
        sub.status = "active"
        sub.current_period_end = None
        sub.razorpay_payment_id = None
        sub.razorpay_order_id = None
        sub.updated_at = datetime.now(timezone.utc)

    org.plan = "free"
    org.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sub)
    return sub


# ---------------------------------------------------------------------------
# Razorpay payment flow
# ---------------------------------------------------------------------------

class _OrderRequest(SubscribeRequest):
    """Internal model re-used for the create-order endpoint."""
    pass


from pydantic import BaseModel


class CreateOrderRequest(BaseModel):
    amount: int          # Amount in **paise** (INR smallest unit). e.g. ₹499 → 49900
    currency: str = "INR"
    plan: str = "growth"
    interval: str = "month"


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str = "growth"
    interval: str = "month"


@router.post("/razorpay/create-order")
async def create_razorpay_order(
    body: CreateOrderRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Step 1 – Server-side: create a Razorpay Order.
    The frontend calls this first, then opens the Razorpay checkout modal.
    """
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        # Dev fallback: return a mock order so the UI can function without keys.
        return {
            "id": "order_mock_development",
            "amount": body.amount,
            "currency": body.currency,
            "plan": body.plan,
            "interval": body.interval,
            "mode": "mock",
        }

    client = _get_razorpay_client()
    try:
        order = client.order.create(
            data={
                "amount": body.amount,
                "currency": body.currency,
                "payment_capture": 1,
                "notes": {
                    "org_id": str(current_user.org_id),
                    "user_id": str(current_user.user_id),
                    "plan": body.plan,
                    "interval": body.interval,
                },
            }
        )
        # Attach plan, interval, and key_id so the frontend has everything needed to initiate checkout
        order["plan"] = body.plan
        order["interval"] = body.interval
        order["key_id"] = settings.razorpay_key_id
        return order
    except Exception as e:
        logger.error(f"Failed to create Razorpay order: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/razorpay/verify-payment")
async def verify_razorpay_payment(
    body: VerifyPaymentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Step 2 – Server-side: verify the cryptographic signature returned by Razorpay
    and then activate the subscription in the database.
    """
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        # Dev fallback: skip signature check and grant the plan directly.
        plan = body.plan if body.plan in ["growth", "pro", "enterprise"] else "growth"
        await _fulfill_subscription(
            db=db,
            org_id=current_user.org_id,
            user_id=current_user.user_id,
            plan=plan,
            razorpay_payment_id=body.razorpay_payment_id or "pay_mock_development",
            razorpay_order_id=body.razorpay_order_id or "order_mock_development",
            billing_interval=body.interval,
        )
        return {"success": True, "plan": plan, "mode": "mock_development"}

    client = _get_razorpay_client()

    # Cryptographic signature verification
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": body.razorpay_order_id,
                "razorpay_payment_id": body.razorpay_payment_id,
                "razorpay_signature": body.razorpay_signature,
            }
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment signature verification failed. Possible tampering detected.",
        )

    plan = body.plan if body.plan in ["growth", "pro", "enterprise"] else "growth"

    await _fulfill_subscription(
        db=db,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        plan=plan,
        razorpay_payment_id=body.razorpay_payment_id,
        razorpay_order_id=body.razorpay_order_id,
        billing_interval=body.interval,
    )

    return {"success": True, "plan": plan}
