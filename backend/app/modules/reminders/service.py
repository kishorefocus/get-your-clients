import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reminder import Reminder
from app.modules.reminders import repository
from app.schemas.reminder import ReminderCreateRequest, ReminderUpdateRequest


async def list_reminders(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    due_soon: bool = False,
) -> list[Reminder]:
    return await repository.list_for_user(
        db, org_id=org_id, user_id=user_id, due_soon=due_soon
    )


async def create_reminder(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: ReminderCreateRequest,
) -> Reminder:
    fields = payload.model_dump()
    reminder = await repository.create(db, org_id=org_id, user_id=user_id, **fields)
    await db.commit()
    await db.refresh(reminder)
    return reminder


async def update_reminder(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    reminder_id: uuid.UUID,
    payload: ReminderUpdateRequest,
) -> Reminder:
    reminder = await repository.get_by_id(
        db, org_id=org_id, user_id=user_id, reminder_id=reminder_id
    )
    if reminder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    fields = payload.model_dump(exclude_unset=True)
    # Allow setting is_done=False (falsy) — handle explicitly
    if "is_done" in fields and fields["is_done"] is not None:
        reminder.is_done = fields.pop("is_done")

    if fields:
        reminder = await repository.update(db, reminder=reminder, **fields)

    await db.commit()
    await db.refresh(reminder)
    return reminder


async def delete_reminder(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, reminder_id: uuid.UUID
) -> None:
    reminder = await repository.get_by_id(
        db, org_id=org_id, user_id=user_id, reminder_id=reminder_id
    )
    if reminder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    await repository.delete(db, reminder=reminder)
    await db.commit()
