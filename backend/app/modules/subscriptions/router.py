import uuid
from datetime import datetime, timedelta, timezone

import stripe
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
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

    if payload.plan == "free":
        # Handle cancel/downgrade to free
        if sub and sub.stripe_subscription_id:
            stripe.api_key = settings.stripe_secret_key
            try:
                stripe.Subscription.delete(sub.stripe_subscription_id)
            except Exception:
                # Log or handle stripe deletion failure, but proceed with DB downgrade
                pass

        if sub is None:
            sub = Subscription(
                org_id=current_user.org_id,
                plan="free",
                status="active",
                current_period_end=None,
                stripe_subscription_id=None,
            )
            db.add(sub)
        else:
            sub.plan = "free"
            sub.status = "active"
            sub.current_period_end = None
            sub.stripe_subscription_id = None
            sub.updated_at = datetime.now(timezone.utc)

        org.plan = "free"
        org.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(sub)
        return sub

    # For paid plans (growth, pro, enterprise), create a Stripe Checkout Session
    stripe.api_key = settings.stripe_secret_key
    
    plan_prices = {
        "growth": {"month": 1900, "year": 1500 * 12},
        "pro": {"month": 4900, "year": 3900 * 12},
        "enterprise": {"month": 14900, "year": 11900 * 12},
    }
    
    unit_amount = plan_prices.get(payload.plan, {}).get(payload.interval, 4900)
    
    checkout_kwargs = {
        "payment_method_types": ["card"],
        "line_items": [{
            "price_data": {
                "currency": "usd",
                "product_data": {
                    "name": f"GlobalReach {payload.plan.capitalize()} Plan ({payload.interval.capitalize()}ly)",
                    "description": f"Access to GlobalReach {payload.plan.capitalize()} features",
                },
                "unit_amount": unit_amount,
                "recurring": {
                    "interval": payload.interval,
                },
            },
            "quantity": 1,
        }],
        "mode": "subscription",
        "success_url": "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
        "cancel_url": "http://localhost:3000/cancel",
        "metadata": {
            "org_id": str(current_user.org_id),
            "plan": payload.plan,
            "user_id": str(current_user.user_id),
        }
    }

    if sub and sub.stripe_customer_id:
        checkout_kwargs["customer"] = sub.stripe_customer_id

    try:
        session = stripe.checkout.Session.create(**checkout_kwargs)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create Stripe checkout session: {str(e)}",
        )

    # Return the current subscription state decorated with checkout_url
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

    response_data = SubscriptionResponse.model_validate(sub)
    response_data.checkout_url = session.url
    return response_data


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

    if sub and sub.stripe_subscription_id:
        stripe.api_key = settings.stripe_secret_key
        try:
            stripe.Subscription.delete(sub.stripe_subscription_id)
        except Exception:
            pass

    if sub is None:
        sub = Subscription(
            org_id=current_user.org_id,
            plan="free",
            status="active",
            current_period_end=None,
            stripe_subscription_id=None,
        )
        db.add(sub)
    else:
        sub.plan = "free"
        sub.status = "active"
        sub.current_period_end = None
        sub.stripe_subscription_id = None
        sub.updated_at = datetime.now(timezone.utc)

    org.plan = "free"
    org.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(sub)
    return sub


@router.post("/confirm-payment")
async def confirm_payment(
    session_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stripe.api_key = settings.stripe_secret_key
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to retrieve Stripe session: {str(e)}",
        )

    metadata = session.get("metadata", {})
    org_id_str = metadata.get("org_id")
    if not org_id_str or org_id_str != str(current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session does not belong to your organization",
        )

    if session.get("payment_status") != "unpaid":
        await fulfill_checkout_session(session, db)
        return {"status": "success", "plan": metadata.get("plan")}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment is not completed",
        )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header",
        )

    stripe.api_key = settings.stripe_secret_key
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret or ""
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )

    # Handle event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await fulfill_checkout_session(session, db)
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        await handle_subscription_deleted(subscription, db)

    return {"status": "success"}


async def fulfill_checkout_session(session: dict, db: AsyncSession):
    metadata = session.get("metadata", {})
    org_id_str = metadata.get("org_id")
    plan = metadata.get("plan")
    user_id_str = metadata.get("user_id")

    if not org_id_str or not plan:
        return

    try:
        org_id = uuid.UUID(org_id_str)
        user_id = uuid.UUID(user_id_str) if user_id_str else None
    except ValueError:
        return

    org = await db.get(Organization, org_id)
    if not org:
        return

    stmt = select(Subscription).where(Subscription.org_id == org_id)
    sub = await db.scalar(stmt)

    stripe_sub_id = session.get("subscription")
    stripe_cust_id = session.get("customer")

    current_period_end = None
    billing_interval = "month"
    if stripe_sub_id:
        try:
            stripe.api_key = settings.stripe_secret_key
            stripe_sub = stripe.Subscription.retrieve(stripe_sub_id)
            current_period_end = datetime.fromtimestamp(
                stripe_sub.current_period_end, tz=timezone.utc
            )
            try:
                billing_interval = stripe_sub["items"]["data"][0]["price"]["recurring"]["interval"]
            except Exception:
                pass
        except Exception:
            current_period_end = datetime.now(timezone.utc) + timedelta(days=30)

    if sub is None:
        sub = Subscription(
            org_id=org_id,
            plan=plan,
            status="active",
            current_period_end=current_period_end,
            stripe_subscription_id=stripe_sub_id,
            stripe_customer_id=stripe_cust_id,
            billing_interval=billing_interval,
        )
        db.add(sub)
    else:
        sub.plan = plan
        sub.status = "active"
        sub.current_period_end = current_period_end
        sub.stripe_subscription_id = stripe_sub_id
        sub.billing_interval = billing_interval
        if stripe_cust_id:
            sub.stripe_customer_id = stripe_cust_id
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
        context={"plan": plan, "stripe_subscription_id": stripe_sub_id},
    )

    await db.commit()


async def handle_subscription_deleted(stripe_sub: dict, db: AsyncSession):
    stripe_sub_id = stripe_sub.get("id")
    if not stripe_sub_id:
        return

    stmt = select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
    sub = await db.scalar(stmt)
    if not sub:
        return

    org_id = sub.org_id
    org = await db.get(Organization, org_id)

    sub.plan = "free"
    sub.status = "active"
    sub.current_period_end = None
    sub.stripe_subscription_id = None
    sub.billing_interval = "month"
    sub.updated_at = datetime.now(timezone.utc)

    if org:
        org.plan = "free"
        org.updated_at = datetime.now(timezone.utc)

    from app.core.audit import record
    await record(
        db,
        org_id=org_id,
        user_id=None,
        action="cancel",
        resource_type="subscription",
        resource_id=sub.id,
        context={"plan": "free", "reason": "stripe_subscription_deleted"},
    )

    await db.commit()

