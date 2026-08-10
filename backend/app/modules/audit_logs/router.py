import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, require_role
from app.modules.audit_logs import repository
from app.schemas.audit import AuditLogListResponse, AuditLogResponse

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit-logs"])


@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    action: str | None = Query(default=None, description="Filter by action: view | create | update | delete | search | export"),
    resource_type: str | None = Query(default=None, description="Filter by resource type: client | contact | ..."),
    resource_id: uuid.UUID | None = Query(default=None, description="Filter to a specific resource by ID"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Read-only audit log for compliance review. Admin only.
    Supports filtering by action, resource_type, and resource_id.
    Results are ordered newest-first.
    """
    rows, total = await repository.list_for_org(
        db,
        org_id=current_user.org_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        limit=limit,
        offset=offset,
    )
    return AuditLogListResponse(
        results=[AuditLogResponse.model_validate(r) for r in rows],
        total=total,
    )
