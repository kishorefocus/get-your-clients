import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


async def list_for_org(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    action: str | None = None,
    resource_type: str | None = None,
    resource_id: uuid.UUID | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[AuditLog], int]:
    """Return paginated audit logs for the org with optional filters."""
    base = select(AuditLog).where(AuditLog.org_id == org_id)
    if action:
        base = base.where(AuditLog.action == action)
    if resource_type:
        base = base.where(AuditLog.resource_type == resource_type)
    if resource_id:
        base = base.where(AuditLog.resource_id == resource_id)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = await db.scalar(count_stmt) or 0

    rows_stmt = base.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
    rows = list(await db.scalars(rows_stmt))
    return rows, total
