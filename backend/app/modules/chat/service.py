import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message, MessageStatus, MessageThread


async def get_or_create_thread(db: AsyncSession, *, org_id: uuid.UUID, client_id: uuid.UUID) -> MessageThread:
    thread = await db.scalar(
        select(MessageThread).where(MessageThread.org_id == org_id, MessageThread.client_id == client_id)
    )
    if thread is None:
        thread = MessageThread(org_id=org_id, client_id=client_id)
        db.add(thread)
        await db.commit()
    return thread


async def save_message(db: AsyncSession, *, thread_id: uuid.UUID, sender_user_id: uuid.UUID | None, body: str) -> Message:
    message = Message(thread_id=thread_id, sender_user_id=sender_user_id, body=body, status=MessageStatus.SENT.value)
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


async def mark_read(db: AsyncSession, *, message_id: uuid.UUID) -> None:
    message = await db.get(Message, message_id)
    if message is not None:
        message.status = MessageStatus.READ.value
        await db.commit()
