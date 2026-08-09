import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import audit
from app.models.client import Client
from app.modules.clients import repository
from app.modules.clients.search import search_clients as _search_clients
from app.schemas.client import ClientCreateRequest, ClientSearchRequest, ClientUpdateRequest


async def get_client(db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, client_id: uuid.UUID) -> Client:
    client = await repository.get_by_id(db, org_id=org_id, client_id=client_id)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    await audit.record(db, org_id=org_id, user_id=user_id, action="view", resource_type="client", resource_id=client_id)
    await db.commit()
    return client


async def create_client(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, payload: ClientCreateRequest
) -> Client:
    fields = payload.model_dump(exclude={"metadata"})
    fields["metadata_json"] = payload.metadata
    client = await repository.create(db, org_id=org_id, **fields)
    await audit.record(db, org_id=org_id, user_id=user_id, action="create", resource_type="client", resource_id=client.id)
    await db.commit()
    return client


async def update_client(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    client_id: uuid.UUID,
    payload: ClientUpdateRequest,
) -> Client:
    client = await repository.get_by_id(db, org_id=org_id, client_id=client_id)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if client.org_id != org_id:
        # It's a shared global-dataset row (org_id IS NULL) — orgs can view/pipeline it,
        # but editing the shared record itself is not allowed from this org's context.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot edit a shared dataset record directly; add your own notes/pipeline entries instead",
        )

    fields = payload.model_dump(exclude_unset=True, exclude={"metadata"})
    if payload.metadata is not None:
        fields["metadata_json"] = payload.metadata
    client = await repository.update(db, client=client, **fields)
    await audit.record(db, org_id=org_id, user_id=user_id, action="update", resource_type="client", resource_id=client.id)
    await db.commit()
    return client


async def delete_client(db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, client_id: uuid.UUID) -> None:
    client = await repository.get_by_id(db, org_id=org_id, client_id=client_id)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if client.org_id != org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete a shared dataset record")
    await audit.record(db, org_id=org_id, user_id=user_id, action="delete", resource_type="client", resource_id=client.id)
    await repository.delete(db, client=client)
    await db.commit()


async def search(db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, query: ClientSearchRequest):
    clients, distances, next_cursor = await _search_clients(db, org_id=org_id, query=query)
    await audit.record(
        db,
        org_id=org_id,
        user_id=user_id,
        action="search",
        resource_type="client",
        context={"keyword": query.keyword, "industry_id": str(query.industry_id) if query.industry_id else None},
    )
    await db.commit()
    return clients, distances, next_cursor
