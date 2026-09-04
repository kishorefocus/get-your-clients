import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pipeline import ClientPipelineState, PipelineStage
from app.models.client import Client
from app.models.user import User
from app.models.reminder import Reminder
from app.schemas.pipeline import KanbanColumnResponse, MoveClientStageRequest, PipelineStageCreateRequest, KanbanClientItem


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
        stmt = (
            select(Client, User.full_name, User.email)
            .join(ClientPipelineState, Client.id == ClientPipelineState.client_id)
            .outerjoin(User, ClientPipelineState.assigned_user_id == User.id)
            .where(
                ClientPipelineState.org_id == org_id,
                ClientPipelineState.stage_id == stage.id
            )
        )
        res = await db.execute(stmt)
        
        clients_in_stage = []
        for row in res.all():
            client, rep_name, rep_email = row
            
            # Find next follow-up date (next pending reminder due date)
            reminder_stmt = (
                select(Reminder.due_at)
                .where(Reminder.client_id == client.id, Reminder.is_done == False)
                .order_by(Reminder.due_at.asc())
                .limit(1)
            )
            next_follow_up = await db.scalar(reminder_stmt)
            
            # Priority: let's map based on rating
            priority = "medium"
            if client.rating and client.rating >= 4.5:
                priority = "high"
            elif client.rating and client.rating < 4.0:
                priority = "low"
                
            clients_in_stage.append(
                KanbanClientItem(
                    id=client.id,
                    name=client.name,
                    city=client.city,
                    country=client.country,
                    rating=client.rating,
                    category=client.tags[0].name if client.tags else (client.industry.name if client.industry else "Lead"),
                    priority=priority,
                    nextFollowUp=next_follow_up.isoformat() if next_follow_up else None,
                    assignedRep=rep_name or rep_email,
                    phone=client.phone,
                    email=client.email,
                )
            )
        board.append(KanbanColumnResponse(stage=stage, clients=clients_in_stage))
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
