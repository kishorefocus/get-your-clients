import uuid
import hmac
import hashlib
from datetime import datetime, timedelta, timezone

# pyrefly: ignore [missing-import]
import httpx
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


async def cancel_paddle_subscription(subscription_id: str) -> bool:
    if not settings.paddle_api_key:
        return False
    
    domain = "sandbox-api.paddle.com" if settings.paddle_environment == "sandbox" else "api.paddle.com"
    url = f"https://{domain}/subscriptions/{subscription_id}/cancel"
    
    headers = {
        "Authorization": f"Bearer {settings.paddle_api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "effective_from": "immediately"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=data)
            return response.status_code == 200
        except Exception:
            return False


def verify_paddle_signature(raw_body: bytes, signature_header: str, secret: str) -> bool:
    try:
        parts = dict(part.split("=") for part in signature_header.split(";"))
        timestamp = parts.get("ts")
        h1 = parts.get("h1")
    except Exception:
        return False

    if not timestamp or not h1:
        return False

    signed_payload = timestamp.encode("utf-8") + b":" + raw_body
    computed_hash = hmac.new(
        secret.encode("utf-8"),
        signed_payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(computed_hash, h1)


async def fulfill_paddle_checkout(
    db: AsyncSession,
    org_id_str: str,
    plan: str,
    user_id_str: str | None,
    paddle_sub_id: str | None,
    paddle_cust_id: str | None,
    billing_interval: str,
    current_period_end: datetime | None = None
):
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

    if current_period_end is None:
        days = 365 if billing_interval == "year" else 30
        current_period_end = datetime.now(timezone.utc) + timedelta(days=days)

    if sub is None:
        sub = Subscription(
            org_id=org_id,
            plan=plan,
            status="active",
            current_period_end=current_period_end,
            paddle_subscription_id=paddle_sub_id,
            paddle_customer_id=paddle_cust_id,
            billing_interval=billing_interval,
        )
        db.add(sub)
    else:
        sub.plan = plan
        sub.status = "active"
        sub.current_period_end = current_period_end
        sub.paddle_subscription_id = paddle_sub_id
        sub.billing_interval = billing_interval
        if paddle_cust_id:
            sub.paddle_customer_id = paddle_cust_id
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
        context={"plan": plan, "paddle_subscription_id": paddle_sub_id},
    )

    await db.commit()


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
        if sub and sub.paddle_subscription_id:
            await cancel_paddle_subscription(sub.paddle_subscription_id)

        if sub is None:
            sub = Subscription(
                org_id=current_user.org_id,
                plan="free",
                status="active",
                current_period_end=None,
                paddle_subscription_id=None,
            )
            db.add(sub)
        else:
            sub.plan = "free"
            sub.status = "active"
            sub.current_period_end = None
            sub.paddle_subscription_id = None
            sub.updated_at = datetime.now(timezone.utc)

        org.plan = "free"
        org.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(sub)
        return sub

    # Paid plans are initiated client-side using Paddle.js overlay
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Subscription checkouts for paid plans must be initiated via the client-side checkout overlay."
    )


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

    if sub and sub.paddle_subscription_id:
        await cancel_paddle_subscription(sub.paddle_subscription_id)

    if sub is None:
        sub = Subscription(
            org_id=current_user.org_id,
            plan="free",
            status="active",
            current_period_end=None,
            paddle_subscription_id=None,
        )
        db.add(sub)
    else:
        sub.plan = "free"
        sub.status = "active"
        sub.current_period_end = None
        sub.paddle_subscription_id = None
        sub.updated_at = datetime.now(timezone.utc)

    org.plan = "free"
    org.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(sub)
    return sub


@router.post("/confirm-payment")
async def confirm_payment(
    transaction_id: str,
    plan: str | None = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not settings.paddle_api_key:
        plan_to_grant = plan or "growth"
        if plan_to_grant not in ["growth", "pro", "enterprise"]:
            plan_to_grant = "growth"

        # Dev fallback: automatically upgrade the organization to the selected plan
        org = await db.get(Organization, current_user.org_id)
        if org is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found",
            )
        
        stmt = select(Subscription).where(Subscription.org_id == current_user.org_id)
        sub = await db.scalar(stmt)
        
        current_period_end = datetime.now(timezone.utc) + timedelta(days=30)
        
        if sub is None:
            sub = Subscription(
                org_id=current_user.org_id,
                plan=plan_to_grant,
                status="active",
                current_period_end=current_period_end,
                paddle_subscription_id="sub_mock_development",
                paddle_customer_id="ctm_mock_development",
                billing_interval="month",
            )
            db.add(sub)
        else:
            sub.plan = plan_to_grant
            sub.status = "active"
            sub.current_period_end = current_period_end
            sub.paddle_subscription_id = "sub_mock_development"
            sub.paddle_customer_id = "ctm_mock_development"
            sub.billing_interval = "month"
            sub.updated_at = datetime.now(timezone.utc)
            
        org.plan = plan_to_grant
        org.updated_at = datetime.now(timezone.utc)
        await db.commit()
        return {"status": "success", "plan": plan_to_grant, "mode": "mock_development"}

    domain = "sandbox-api.paddle.com" if settings.paddle_environment == "sandbox" else "api.paddle.com"
    url = f"https://{domain}/transactions/{transaction_id}"
    headers = {
        "Authorization": f"Bearer {settings.paddle_api_key}",
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to connect to Paddle API: {str(e)}",
            )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch transaction from Paddle: {response.text}",
        )

    tx_data = response.json().get("data", {})
    if tx_data.get("status") != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction is not completed (status: {tx_data.get('status')})",
        )

    custom_data = tx_data.get("custom_data") or {}
    org_id_str = custom_data.get("org_id")
    plan = custom_data.get("plan", "growth")
    user_id_str = custom_data.get("user_id")

    if not org_id_str or org_id_str != str(current_user.org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Transaction does not belong to your organization",
        )

    paddle_sub_id = tx_data.get("subscription_id")
    paddle_cust_id = tx_data.get("customer_id")

    billing_interval = "month"
    current_period_end = None

    if paddle_sub_id:
        sub_url = f"https://{domain}/subscriptions/{paddle_sub_id}"
        try:
            async with httpx.AsyncClient() as client:
                sub_res = await client.get(sub_url, headers=headers)
                if sub_res.status_code == 200:
                    sub_data = sub_res.json().get("data", {})
                    billing_period = sub_data.get("current_billing_period", {})
                    end_str = billing_period.get("ends_at") or billing_period.get("end")
                    if end_str:
                        current_period_end = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
                    
                    billing_cycle = sub_data.get("billing_cycle", {})
                    interval = billing_cycle.get("interval")
                    if interval in ["month", "year"]:
                        billing_interval = interval
        except Exception:
            pass

    await fulfill_paddle_checkout(
        db=db,
        org_id_str=org_id_str,
        plan=plan,
        user_id_str=user_id_str,
        paddle_sub_id=paddle_sub_id,
        paddle_cust_id=paddle_cust_id,
        billing_interval=billing_interval,
        current_period_end=current_period_end,
    )

    return {"status": "success", "plan": plan}


@router.post("/webhook")
async def paddle_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("Paddle-Signature")

    if settings.paddle_webhook_secret:
        if not sig_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Paddle-Signature header",
            )
        if not verify_paddle_signature(payload, sig_header, settings.paddle_webhook_secret):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature",
            )

    try:
        event = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )

    event_type = event.get("event_type")
    data = event.get("data", {})

    if event_type == "transaction.completed":
        custom_data = data.get("custom_data") or {}
        org_id_str = custom_data.get("org_id")
        plan = custom_data.get("plan", "growth")
        user_id_str = custom_data.get("user_id")
        
        paddle_sub_id = data.get("subscription_id")
        paddle_cust_id = data.get("customer_id")
        
        billing_interval = "month"
        try:
            items = data.get("items", [])
            if items:
                interval = items[0].get("price", {}).get("billing_cycle", {}).get("interval")
                if interval in ["month", "year"]:
                    billing_interval = interval
        except Exception:
            pass

        if org_id_str:
            await fulfill_paddle_checkout(
                db=db,
                org_id_str=org_id_str,
                plan=plan,
                user_id_str=user_id_str,
                paddle_sub_id=paddle_sub_id,
                paddle_cust_id=paddle_cust_id,
                billing_interval=billing_interval,
            )

    elif event_type in ["subscription.updated", "subscription.canceled"]:
        paddle_sub_id = data.get("id")
        status_str = data.get("status")

        if paddle_sub_id:
            stmt = select(Subscription).where(Subscription.paddle_subscription_id == paddle_sub_id)
            sub = await db.scalar(stmt)
            if sub:
                org_id = sub.org_id
                org = await db.get(Organization, org_id)

                if event_type == "subscription.canceled" or status_str in ["cancelled", "paused"]:
                    sub.plan = "free"
                    sub.status = "active"
                    sub.current_period_end = None
                    sub.paddle_subscription_id = None
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
                        context={"plan": "free", "reason": "paddle_subscription_deleted"},
                    )
                else:
                    billing_cycle = data.get("billing_cycle", {})
                    interval = billing_cycle.get("interval")
                    if interval in ["month", "year"]:
                        sub.billing_interval = interval

                    billing_period = data.get("current_billing_period", {})
                    end_str = billing_period.get("ends_at") or billing_period.get("end")
                    if end_str:
                        try:
                            sub.current_period_end = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
                        except Exception:
                            pass
                    
                    sub.status = "active"
                    sub.updated_at = datetime.now(timezone.utc)

                await db.commit()

    return {"status": "success"}
