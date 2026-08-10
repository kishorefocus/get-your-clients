import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saved_search import SavedSearch
from app.modules.saved_searches import repository
from app.schemas.saved_search import SavedSearchCreateRequest, SavedSearchUpdateRequest


async def list_searches(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID
) -> list[SavedSearch]:
    return await repository.list_for_user(db, org_id=org_id, user_id=user_id)


async def create_search(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: SavedSearchCreateRequest,
) -> SavedSearch:
    ss = await repository.create(
        db, org_id=org_id, user_id=user_id, name=payload.name, query=payload.query
    )
    await db.commit()
    await db.refresh(ss)
    return ss


async def update_search(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    search_id: uuid.UUID,
    payload: SavedSearchUpdateRequest,
) -> SavedSearch:
    ss = await repository.get_by_id(db, org_id=org_id, user_id=user_id, search_id=search_id)
    if ss is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved search not found")
    fields = payload.model_dump(exclude_unset=True)
    ss = await repository.update(db, saved_search=ss, **fields)
    await db.commit()
    await db.refresh(ss)
    return ss


async def delete_search(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, search_id: uuid.UUID
) -> None:
    ss = await repository.get_by_id(db, org_id=org_id, user_id=user_id, search_id=search_id)
    if ss is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved search not found")
    await repository.delete(db, saved_search=ss)
    await db.commit()
