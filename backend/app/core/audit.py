import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


async def record(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID | None,
    action: str,
    resource_type: str,
    resource_id: uuid.UUID | None = None,
    context: dict | None = None,
) -> None:
    """
    Fire-and-forget audit write. Called from service methods (not routers)
    for anything touching client/contact PII: view, export, update, delete.
    Does not commit — piggybacks on the caller's existing transaction so a
    failed audit write rolls back with the action it was auditing, not
    silently after it.
    """
    db.add(
        AuditLog(
            org_id=org_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            context=context or {},
        )
    )
