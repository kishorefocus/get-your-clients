import uuid

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user
from app.modules.chat import service
from app.modules.chat.manager import manager
from app.core.security import JWTError, TokenType, decode_token
from app.models.message import Message
from app.models.message import MessageThread
from app.schemas.chat import MessageResponse, WebSocketEvent

router = APIRouter(tags=["chat"])


@router.get("/api/v1/chat/threads")
async def list_threads(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_threads(db, org_id=current_user.org_id)


@router.post("/api/v1/chat/threads/by-client/{client_id}")
async def get_or_create_thread_for_client(
    client_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the thread_id to connect /ws/chat/{thread_id} to for this client, creating it on first use."""
    thread = await service.get_or_create_thread(db, org_id=current_user.org_id, client_id=client_id)
    return {"thread_id": thread.id}



@router.get("/api/v1/chat/threads/{thread_id}/messages", response_model=list[MessageResponse])
async def get_message_history(
    thread_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.scalars(
        select(Message).where(Message.thread_id == thread_id).order_by(Message.created_at.asc())
    )
    return list(result)


def _authenticate_ws(token: str) -> CurrentUser:
    """
    Browsers can't set Authorization headers on WebSocket upgrade requests,
    so the access token is passed as a query param instead: this is the
    standard workaround, but it does mean tokens can end up in server access
    logs — scrub `token` from any WS URL logging middleware you add.
    """
    payload = decode_token(token)
    if payload.get("type") != TokenType.ACCESS.value:
        raise JWTError("wrong token type")
    return CurrentUser(user_id=uuid.UUID(payload["sub"]), org_id=uuid.UUID(payload["org_id"]), role=payload["role"])


@router.websocket("/ws/chat/{thread_id}")
async def chat_websocket(websocket: WebSocket, thread_id: uuid.UUID, token: str = Query(...)):
    try:
        current_user = _authenticate_ws(token)
    except JWTError:
        await websocket.close(code=4401)
        return

    # Resolve client_id from thread so we can write an Interaction row
    async with AsyncSessionLocal() as db:
        thread = await db.get(MessageThread, thread_id)
    client_id = thread.client_id if thread else None

    await manager.connect(thread_id, websocket)
    try:
        while True:
            raw = await websocket.receive_json()
            body = raw.get("body", "").strip()
            if not body:
                continue

            async with AsyncSessionLocal() as db:
                message = await service.save_message(
                    db,
                    thread_id=thread_id,
                    sender_user_id=current_user.user_id,
                    body=body,
                    org_id=current_user.org_id,
                    client_id=client_id,
                )

            event = WebSocketEvent(
                event="message.new",
                data=MessageResponse.model_validate(message).model_dump(mode="json"),
            )
            await manager.publish(thread_id, event.model_dump())
    except WebSocketDisconnect:
        await manager.disconnect(thread_id, websocket)
