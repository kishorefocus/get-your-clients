import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saved_search import SavedSearch


async def list_for_user(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID
) -> list[SavedSearch]:
    result = await db.scalars(
        select(SavedSearch)
        .where(SavedSearch.org_id == org_id, SavedSearch.user_id == user_id)
        .order_by(SavedSearch.created_at.desc())
    )
    return list(result)


async def get_by_id(
    db: AsyncSession, *, org_id: uuid.UUID, user_id: uuid.UUID, search_id: uuid.UUID
) -> SavedSearch | None:
    return await db.scalar(
        select(SavedSearch).where(
            SavedSearch.id == search_id,
            SavedSearch.org_id == org_id,
            SavedSearch.user_id == user_id,
        )
    )


async def create(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    name: str,
    query: dict,
) -> SavedSearch:
    ss = SavedSearch(org_id=org_id, user_id=user_id, name=name, query=query)
    db.add(ss)
    await db.flush()
    return ss


async def update(db: AsyncSession, *, saved_search: SavedSearch, **fields) -> SavedSearch:
    for key, value in fields.items():
        if value is not None:
            setattr(saved_search, key, value)
    await db.flush()
    return saved_search


async def delete(db: AsyncSession, *, saved_search: SavedSearch) -> None:
    await db.delete(saved_search)
    await db.flush()
