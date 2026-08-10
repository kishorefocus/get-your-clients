import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reminder import Reminder


async def list_for_user(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    due_soon: bool = False,
) -> list[Reminder]:
    stmt = (
        select(Reminder)
        .where(Reminder.org_id == org_id, Reminder.user_id == user_id)
        .order_by(Reminder.due_at.asc())
    )
    if due_soon:
        now = datetime.now(timezone.utc)
        cutoff = now + timedelta(hours=48)
        stmt = stmt.where(Reminder.due_at >= now, Reminder.due_at <= cutoff, Reminder.is_done.is_(False))
    result = await db.scalars(stmt)
    return list(result)


async def get_by_id(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, reminder_id: uuid.UUID
) -> Reminder | None:
    return await db.scalar(
        select(Reminder).where(
            Reminder.id == reminder_id,
            Reminder.org_id == org_id,
            Reminder.user_id == user_id,
        )
    )


async def create(db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, **fields) -> Reminder:
    reminder = Reminder(org_id=org_id, user_id=user_id, **fields)
    db.add(reminder)
    await db.flush()
    return reminder


async def update(db: AsyncSession, *, reminder: Reminder, **fields) -> Reminder:
    for key, value in fields.items():
        if value is not None:
            setattr(reminder, key, value)
    await db.flush()
    return reminder


async def delete(db: AsyncSession, *, reminder: Reminder) -> None:
    await db.delete(reminder)
    await db.flush()
