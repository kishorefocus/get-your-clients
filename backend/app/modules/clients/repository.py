import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client


def _visible_to_org(org_id: uuid.UUID):
    """
    A client row is visible to an org if it belongs to that org, or if it's
    part of the shared global dataset (org_id IS NULL, e.g. sourced from
    Google Places / a licensed provider before any org has claimed it).
    This filter must be applied on every SELECT — it is the enforcement
    point for multi-tenant isolation, independent of whatever the router
    layer does.
    """
    return or_(Client.org_id == org_id, Client.org_id.is_(None))


async def get_by_id(db: AsyncSession, *, org_id: uuid.UUID, client_id: uuid.UUID) -> Client | None:
    stmt = select(Client).where(Client.id == client_id, _visible_to_org(org_id))
    return await db.scalar(stmt)


async def create(db: AsyncSession, *, org_id: uuid.UUID, **fields) -> Client:
    client = Client(org_id=org_id, **fields)
    db.add(client)
    await db.flush()
    return client


async def update(db: AsyncSession, *, client: Client, **fields) -> Client:
    """
    Callers must have already verified client.org_id == current org (see
    service.py) — this function does not re-check ownership, since a
    globally-shared (org_id IS NULL) row should never be mutated by a
    single org's edit.
    """
    for key, value in fields.items():
        if value is not None:
            setattr(client, key, value)
    await db.flush()
    return client


async def delete(db: AsyncSession, *, client: Client) -> None:
    await db.delete(client)
    await db.flush()
