import base64
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.interaction import Interaction, InteractionType


def _encode_cursor(dt: datetime, row_id: uuid.UUID) -> str:
    raw = f"{dt.isoformat()}|{row_id}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _decode_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
    raw = base64.urlsafe_b64decode(cursor.encode()).decode()
    ts, row_id = raw.split("|", 1)
    return datetime.fromisoformat(ts), uuid.UUID(row_id)


async def list_for_client(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    client_id: uuid.UUID,
    cursor: str | None = None,
    limit: int = 25,
) -> tuple[list[Interaction], str | None]:
    """Return interactions newest-first with keyset pagination."""
    stmt = (
        select(Interaction)
        .where(Interaction.org_id == org_id, Interaction.client_id == client_id)
        .order_by(Interaction.created_at.desc(), Interaction.id.desc())
        .limit(limit + 1)
    )
    if cursor:
        try:
            dt, row_id = _decode_cursor(cursor)
            stmt = stmt.where(
                (Interaction.created_at < dt)
                | ((Interaction.created_at == dt) & (Interaction.id < row_id))
            )
        except Exception:
            pass  # Ignore malformed cursor; return from start

    rows = list(await db.scalars(stmt))
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        last = rows[-1]
        next_cursor = _encode_cursor(last.created_at, last.id)
    return rows, next_cursor


async def create(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    client_id: uuid.UUID,
    user_id: uuid.UUID | None,
    type: str,
    summary: str | None = None,
    related_id: uuid.UUID | None = None,
) -> Interaction:
    interaction = Interaction(
        org_id=org_id,
        client_id=client_id,
        user_id=user_id,
        type=type,
        summary=summary,
        related_id=related_id,
    )
    db.add(interaction)
    await db.flush()
    return interaction
