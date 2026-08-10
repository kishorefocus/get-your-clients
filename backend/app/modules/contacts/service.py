import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import audit
from app.models.contact import Contact
from app.modules.contacts import repository
from app.schemas.contact import ContactCreateRequest, ContactUpdateRequest


async def list_contacts(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, client_id: uuid.UUID
) -> list[Contact]:
    contacts = await repository.list_for_client(db, org_id=org_id, client_id=client_id)
    await audit.record(
        db, org_id=org_id, user_id=user_id, action="view", resource_type="contact",
        context={"client_id": str(client_id)},
    )
    await db.commit()
    return contacts


async def get_contact(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, client_id: uuid.UUID, contact_id: uuid.UUID
) -> Contact:
    contact = await repository.get_by_id(db, org_id=org_id, client_id=client_id, contact_id=contact_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    await audit.record(
        db, org_id=org_id, user_id=user_id, action="view", resource_type="contact", resource_id=contact_id
    )
    await db.commit()
    return contact


async def create_contact(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    client_id: uuid.UUID,
    payload: ContactCreateRequest,
) -> Contact:
    fields = payload.model_dump()
    contact = await repository.create(db, client_id=client_id, **fields)
    await audit.record(
        db, org_id=org_id, user_id=user_id, action="create", resource_type="contact", resource_id=contact.id
    )
    await db.commit()
    await db.refresh(contact)
    return contact


async def update_contact(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    client_id: uuid.UUID,
    contact_id: uuid.UUID,
    payload: ContactUpdateRequest,
) -> Contact:
    contact = await repository.get_by_id(db, org_id=org_id, client_id=client_id, contact_id=contact_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    fields = payload.model_dump(exclude_unset=True, exclude={"opt_out"})
    if payload.opt_out is True:
        await repository.opt_out(db, contact=contact)
    elif fields:
        await repository.update(db, contact=contact, **fields)

    await audit.record(
        db, org_id=org_id, user_id=user_id, action="update", resource_type="contact", resource_id=contact_id
    )
    await db.commit()
    await db.refresh(contact)
    return contact


async def delete_contact(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, client_id: uuid.UUID, contact_id: uuid.UUID
) -> None:
    contact = await repository.get_by_id(db, org_id=org_id, client_id=client_id, contact_id=contact_id)
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    await audit.record(
        db, org_id=org_id, user_id=user_id, action="delete", resource_type="contact", resource_id=contact_id
    )
    await repository.delete(db, contact=contact)
    await db.commit()
