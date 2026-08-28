from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user, require_role
from app.modules.calls import service
from app.schemas.call import CallCreateRequest, CallResponse

router = APIRouter(prefix="/api/v1/calls", tags=["calls"])

@router.get("", response_model=list[CallResponse])
async def list_calls(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_calls(db, org_id=current_user.org_id)

@router.post("", response_model=CallResponse, status_code=201)
async def create_call(
    payload: CallCreateRequest,
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    return await service.create_call(
        db, org_id=current_user.org_id, user_id=current_user.user_id, payload=payload
    )
