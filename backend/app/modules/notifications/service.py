import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.modules.notifications import repository


async def list_notifications(db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID) -> list[Notification]:
    notifications = await repository.list_for_user(db, org_id=org_id, user_id=user_id)
    if not notifications:
        # Generate initial default notifications
        await repository.create(
            db,
            org_id=org_id,
            user_id=user_id,
            title="Welcome to GlobalReach! 🌍",
            message="We are thrilled to have you here. GlobalReach is designed to help you discover and target leads globally, run outreach campaigns, and close high-value deals. Get started by searching for leads in the Discovery tab!",
            type="welcome",
        )
        await repository.create(
            db,
            org_id=org_id,
            user_id=user_id,
            title="Tip: Personalize outreach to lift response rates 🚀",
            message="Tip: Personalizing your outreach emails with the lead's local industry trends and specific names can boost response rates by up to 30%. Try adding custom coordinates and tags!",
            type="tip",
        )
        await repository.create(
            db,
            org_id=org_id,
            user_id=user_id,
            title="Update: Multi-market search is now live 🎉",
            message="You can now search and geocode client addresses across 190+ markets in parallel. The deduplication worker will automatically merge duplicates for you.",
            type="update",
        )
        await db.commit()
        # Fetch list again to include the newly created ones
        notifications = await repository.list_for_user(db, org_id=org_id, user_id=user_id)
    return notifications


async def mark_all_read(db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID) -> None:
    await repository.mark_all_read(db, org_id=org_id, user_id=user_id)
    await db.commit()


async def mark_one_read(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, notification_id: uuid.UUID
) -> Notification:
    notification = await repository.get_by_id(db, org_id=org_id, user_id=user_id, notification_id=notification_id)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification
