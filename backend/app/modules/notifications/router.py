import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user
from app.modules.notifications import service
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all notifications for the current user."""
    return await service.list_notifications(db, org_id=current_user.org_id, user_id=current_user.user_id)


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read for the current user."""
    await service.mark_all_read(db, org_id=current_user.org_id, user_id=current_user.user_id)


@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_one_read(
    notification_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a specific notification as read."""
    return await service.mark_one_read(
        db, org_id=current_user.org_id, user_id=current_user.user_id, notification_id=notification_id
    )
