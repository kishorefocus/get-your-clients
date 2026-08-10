import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user
from app.modules.reminders import service
from app.schemas.reminder import ReminderCreateRequest, ReminderResponse, ReminderUpdateRequest

router = APIRouter(prefix="/api/v1/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderResponse])
async def list_reminders(
    due_soon: bool = Query(
        default=False,
        description="If true, return only incomplete reminders due in the next 48 hours",
    ),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List reminders for the current user.
    Use `?due_soon=true` for a dashboard widget showing what needs attention now.
    """
    return await service.list_reminders(
        db, org_id=current_user.org_id, user_id=current_user.user_id, due_soon=due_soon
    )


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    payload: ReminderCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a reminder / task for the current user."""
    return await service.create_reminder(
        db, org_id=current_user.org_id, user_id=current_user.user_id, payload=payload
    )


@router.patch("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: uuid.UUID,
    payload: ReminderUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a reminder. Send `{"is_done": true}` to mark it complete.
    Only the owning user can update their reminders.
    """
    return await service.update_reminder(
        db,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        reminder_id=reminder_id,
        payload=payload,
    )


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    reminder_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a reminder permanently."""
    await service.delete_reminder(
        db,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        reminder_id=reminder_id,
    )
