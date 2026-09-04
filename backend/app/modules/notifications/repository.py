import uuid
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def list_for_user(db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID) -> list[Notification]:
    stmt = (
        select(Notification)
        .where(Notification.org_id == org_id, Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )
    result = await db.scalars(stmt)
    return list(result)


async def get_by_id(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, notification_id: uuid.UUID
) -> Notification | None:
    return await db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.org_id == org_id,
            Notification.user_id == user_id,
        )
    )


async def create(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, title: str, message: str, type: str
) -> Notification:
    notification = Notification(org_id=org_id, user_id=user_id, title=title, message=message, type=type)
    db.add(notification)
    await db.flush()
    return notification


async def mark_all_read(db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID) -> None:
    stmt = (
        update(Notification)
        .where(Notification.org_id == org_id, Notification.user_id == user_id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.flush()
