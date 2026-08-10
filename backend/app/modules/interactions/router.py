import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user, require_role
from app.modules.interactions import service
from app.schemas.interaction import (
    InteractionCreateRequest,
    InteractionListResponse,
    InteractionResponse,
)

router = APIRouter(
    prefix="/api/v1/clients/{client_id}/interactions",
    tags=["interactions"],
)


@router.get("", response_model=InteractionListResponse)
async def list_interactions(
    client_id: uuid.UUID,
    cursor: str | None = Query(default=None, description="Opaque pagination cursor from previous response"),
    limit: int = Query(default=25, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Unified activity timeline for a client — calls, messages, emails, notes —
    newest first. Use `next_cursor` from the response to page through older entries.
    """
    interactions, next_cursor = await service.list_interactions(
        db,
        org_id=current_user.org_id,
        client_id=client_id,
        cursor=cursor,
        limit=limit,
    )
    return InteractionListResponse(
        results=[InteractionResponse.model_validate(i) for i in interactions],
        next_cursor=next_cursor,
    )


@router.post("", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
async def create_interaction(
    client_id: uuid.UUID,
    payload: InteractionCreateRequest,
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually log an interaction (e.g. a note, an email, an external call).
    For chat messages, these rows are written automatically by the chat service.
    """
    return await service.create_interaction(
        db,
        org_id=current_user.org_id,
        client_id=client_id,
        user_id=current_user.user_id,
        payload=payload,
    )
