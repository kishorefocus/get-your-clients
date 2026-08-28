import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.call import Call
from app.models.client import Client
from app.models.user import User
from app.models.interaction import Interaction, InteractionType
from app.schemas.call import CallCreateRequest, CallResponse

async def list_calls(db: AsyncSession, *, org_id: uuid.UUID) -> list[CallResponse]:
    # Query calls with joined Client and User details
    stmt = (
        select(Call, Client.name, Client.phone, Client.country, User.full_name, User.email)
        .outerjoin(Client, Call.client_id == Client.id)
        .outerjoin(User, Call.user_id == User.id)
        .where(Call.org_id == org_id)
        .order_by(Call.created_at.desc())
    )
    result = await db.execute(stmt)
    
    calls_list = []
    for row in result.all():
        call, client_name, client_phone, client_country, rep_name, rep_email = row
        # Map values to CallResponse
        resp = CallResponse.model_validate(call)
        resp.lead_name = client_name or "Unknown Client"
        resp.lead_phone = client_phone
        resp.lead_country = client_country or "—"
        resp.assigned_rep = rep_name or rep_email or "System"
        calls_list.append(resp)
        
    return calls_list

async def create_call(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, payload: CallCreateRequest
) -> CallResponse:
    call = Call(
        org_id=org_id,
        client_id=payload.client_id,
        user_id=user_id,
        duration_seconds=payload.duration_seconds,
        recording_url=payload.recording_url,
        outcome=payload.outcome,
        provider_call_sid=f"api-sid-{uuid.uuid4().hex[:12]}"
    )
    db.add(call)
    await db.flush()

    # Create interaction entry
    interaction = Interaction(
        org_id=org_id,
        client_id=payload.client_id,
        user_id=user_id,
        type=InteractionType.CALL.value,
        summary=f"Call made. Outcome: {payload.outcome}. Duration: {payload.duration_seconds}s",
        related_id=call.id
    )
    db.add(interaction)
    await db.commit()

    # Fetch fresh client and user info to populate response fields
    client = await db.get(Client, payload.client_id)
    user = await db.get(User, user_id)

    resp = CallResponse.model_validate(call)
    if client:
        resp.lead_name = client.name
        resp.lead_phone = client.phone
        resp.lead_country = client.country
    if user:
        resp.assigned_rep = user.full_name or user.email

    return resp
