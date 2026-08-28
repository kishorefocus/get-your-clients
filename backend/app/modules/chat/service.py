import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.models.interaction import InteractionType
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


async def save_message(
    db: AsyncSession,
    *,
    thread_id: uuid.UUID,
    sender_user_id: uuid.UUID | None,
    body: str,
    org_id: uuid.UUID | None = None,
    client_id: uuid.UUID | None = None,
) -> Message:
    """
    Persist a chat message and — when org_id + client_id are provided —
    also write a unified Interaction row so the activity timeline stays current.
    """
    message = Message(thread_id=thread_id, sender_user_id=sender_user_id, body=body, status=MessageStatus.SENT.value)
    db.add(message)
    await db.flush()

    if org_id is not None and client_id is not None:
        from app.modules.interactions import repository as interaction_repo  # local import avoids circular deps

        await interaction_repo.create(
            db,
            org_id=org_id,
            client_id=client_id,
            user_id=sender_user_id,
            type=InteractionType.CHAT_MESSAGE.value,
            summary=body[:200] if body else None,
            related_id=message.id,
        )

    await db.commit()
    await db.refresh(message)
    return message


async def mark_read(db: AsyncSession, *, message_id: uuid.UUID) -> None:
    message = await db.get(Message, message_id)
    if message is not None:
        message.status = MessageStatus.READ.value
        await db.commit()


async def list_threads(db: AsyncSession, *, org_id: uuid.UUID) -> list[dict]:
    stmt = (
        select(MessageThread, Client.name, Client.country)
        .join(Client, MessageThread.client_id == Client.id)
        .where(MessageThread.org_id == org_id, MessageThread.is_archived == False)
    )
    res = await db.execute(stmt)
    rows = res.all()

    if not rows:
        from app.models.client import Client as ClientModel
        from app.models.message import Message as MessageModel, MessageThread as MessageThreadModel

        # Check if welcome contact exists, or create it
        support_client = await db.scalar(
            select(ClientModel).where(ClientModel.org_id == org_id, ClientModel.email == "support@globalreach.io")
        )
        if not support_client:
            support_client = ClientModel(
                org_id=org_id,
                name="GlobalReach Support",
                email="support@globalreach.io",
                phone="+1 (555) 019-9000",
                website="https://globalreach.io",
                address="100 Pine Street, San Francisco, CA 94111",
                city="San Francisco",
                country="US",
                latitude=37.79,
                longitude=-122.40,
                rating=5.0,
                source="system",
                consent_status="granted"
            )
            db.add(support_client)
            await db.flush()

        # Create thread
        thread = MessageThreadModel(
            org_id=org_id,
            client_id=support_client.id,
            is_archived=False
        )
        db.add(thread)
        await db.flush()

        # Create unread welcome message
        welcome_msg = MessageModel(
            thread_id=thread.id,
            sender_user_id=None,
            body="Welcome to GlobalReach! We're thrilled to have you on board. Start discovering leads, claiming them to your pipeline, and scheduling outreach to grow your client base. If you need any assistance, we're here to help!",
            status="sent"
        )
        db.add(welcome_msg)
        await db.commit()

        # Re-execute query to fetch the seeded thread
        res = await db.execute(stmt)
        rows = res.all()
    
    threads_data = []
    for row in rows:
        thread, client_name, client_country = row
        
        # Last message
        last_msg_stmt = (
            select(Message)
            .where(Message.thread_id == thread.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_msg = await db.scalar(last_msg_stmt)
        
        # Unread count
        unread_stmt = select(func.count(Message.id)).where(
            Message.thread_id == thread.id,
            Message.sender_user_id.is_(None),
            Message.status != "read"
        )
        unread_count = (await db.execute(unread_stmt)).scalar() or 0
        
        threads_data.append({
            "id": str(thread.id),
            "leadId": str(thread.client_id),
            "leadName": client_name or "Unknown Client",
            "leadCountry": client_country or "—",
            "lastMessage": last_msg.body if last_msg else "",
            "lastMessageTime": last_msg.created_at.isoformat() if last_msg else thread.created_at.isoformat(),
            "unreadCount": unread_count,
            "messages": []
        })
        
    threads_data.sort(key=lambda x: x["lastMessageTime"], reverse=True)
    return threads_data

