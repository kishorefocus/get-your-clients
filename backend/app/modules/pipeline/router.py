from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user, require_role
from app.modules.pipeline import service
from app.schemas.pipeline import (
    KanbanColumnResponse,
    MoveClientStageRequest,
    PipelineStageCreateRequest,
    PipelineStageResponse,
)

router = APIRouter(prefix="/api/v1/pipeline", tags=["pipeline"])


@router.get("/stages", response_model=list[PipelineStageResponse])
async def list_stages(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_stages(db, org_id=current_user.org_id)


@router.post("/stages", response_model=PipelineStageResponse, status_code=201)
async def create_stage(
    payload: PipelineStageCreateRequest,
    current_user: CurrentUser = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
):
    return await service.create_stage(db, org_id=current_user.org_id, payload=payload)


@router.get("/board", response_model=list[KanbanColumnResponse])
async def get_board(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_board(db, org_id=current_user.org_id)


@router.post("/move", status_code=204)
async def move_client(
    payload: MoveClientStageRequest,
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    await service.move_client(db, org_id=current_user.org_id, payload=payload)
