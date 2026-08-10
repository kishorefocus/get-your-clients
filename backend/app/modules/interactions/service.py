import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.interaction import Interaction
from app.modules.interactions import repository
from app.schemas.interaction import InteractionCreateRequest


async def list_interactions(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    client_id: uuid.UUID,
    cursor: str | None = None,
    limit: int = 25,
) -> tuple[list[Interaction], str | None]:
    return await repository.list_for_client(
        db, org_id=org_id, client_id=client_id, cursor=cursor, limit=limit
    )


async def create_interaction(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    client_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: InteractionCreateRequest,
) -> Interaction:
    interaction = await repository.create(
        db,
        org_id=org_id,
        client_id=client_id,
        user_id=user_id,
        type=payload.type,
        summary=payload.summary,
        related_id=payload.related_id,
    )
    await db.commit()
    await db.refresh(interaction)
    return interaction


async def record_interaction(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    client_id: uuid.UUID,
    user_id: uuid.UUID | None,
    type: str,
    summary: str | None = None,
    related_id: uuid.UUID | None = None,
) -> Interaction:
    """
    Internal helper called from other service layers (chat, calls, etc.)
    to write an interaction row without going through the router. Does NOT
    commit — callers must commit their own transaction.
    """
    return await repository.create(
        db,
        org_id=org_id,
        client_id=client_id,
        user_id=user_id,
        type=type,
        summary=summary,
        related_id=related_id,
    )
