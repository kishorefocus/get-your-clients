import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact import Contact


async def list_for_client(db: AsyncSession, *, org_id: uuid.UUID, client_id: uuid.UUID) -> list[Contact]:
    """Return all contacts belonging to a client, scoped to the org."""
    stmt = (
        select(Contact)
        .where(Contact.client_id == client_id)
        .order_by(Contact.created_at.asc())
    )
    result = await db.scalars(stmt)
    return list(result)


async def get_by_id(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    client_id: uuid.UUID,
    contact_id: uuid.UUID,
) -> Contact | None:
    stmt = select(Contact).where(
        Contact.id == contact_id,
        Contact.client_id == client_id,
    )
    return await db.scalar(stmt)


async def create(
    db: AsyncSession,
    *,
    client_id: uuid.UUID,
    **fields,
) -> Contact:
    contact = Contact(client_id=client_id, **fields)
    db.add(contact)
    await db.flush()
    return contact


async def update(db: AsyncSession, *, contact: Contact, **fields) -> Contact:
    for key, value in fields.items():
        if value is not None:
            setattr(contact, key, value)
    await db.flush()
    return contact


async def opt_out(db: AsyncSession, *, contact: Contact) -> Contact:
    contact.opt_out_at = datetime.now(timezone.utc)
    contact.consent_status = "opted_out"
    await db.flush()
    return contact


async def delete(db: AsyncSession, *, contact: Contact) -> None:
    await db.delete(contact)
    await db.flush()
