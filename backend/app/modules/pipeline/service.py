import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pipeline import ClientPipelineState, PipelineStage
from app.schemas.pipeline import KanbanColumnResponse, MoveClientStageRequest, PipelineStageCreateRequest


async def list_stages(db: AsyncSession, *, org_id: uuid.UUID) -> list[PipelineStage]:
    result = await db.scalars(
        select(PipelineStage).where(PipelineStage.org_id == org_id).order_by(PipelineStage.position)
    )
    return list(result)


async def create_stage(db: AsyncSession, *, org_id: uuid.UUID, payload: PipelineStageCreateRequest) -> PipelineStage:
    stage = PipelineStage(org_id=org_id, **payload.model_dump())
    db.add(stage)
    await db.commit()
    return stage


async def get_board(db: AsyncSession, *, org_id: uuid.UUID) -> list[KanbanColumnResponse]:
    stages = await list_stages(db, org_id=org_id)
    board = []
    for stage in stages:
        client_ids = await db.scalars(
            select(ClientPipelineState.client_id).where(
                ClientPipelineState.org_id == org_id, ClientPipelineState.stage_id == stage.id
            )
        )
        board.append(KanbanColumnResponse(stage=stage, client_ids=list(client_ids)))
    return board


async def move_client(db: AsyncSession, *, org_id: uuid.UUID, payload: MoveClientStageRequest) -> None:
    stage = await db.get(PipelineStage, payload.stage_id)
    if stage is None or stage.org_id != org_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pipeline stage not found")

    state = await db.scalar(
        select(ClientPipelineState).where(
            ClientPipelineState.org_id == org_id, ClientPipelineState.client_id == payload.client_id
        )
    )
    if state is None:
        state = ClientPipelineState(org_id=org_id, client_id=payload.client_id, stage_id=payload.stage_id)
        db.add(state)
    else:
        state.stage_id = payload.stage_id

    if payload.assigned_user_id is not None:
        state.assigned_user_id = payload.assigned_user_id

    await db.commit()
