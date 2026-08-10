import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.industry import Industry


async def list_all(db: AsyncSession, *, parent_id: uuid.UUID | None = None) -> list[Industry]:
    """Return all industries. Optionally filter to a single parent level."""
    stmt = select(Industry).order_by(Industry.name.asc())
    if parent_id is not None:
        stmt = stmt.where(Industry.parent_id == parent_id)
    result = await db.scalars(stmt)
    return list(result)


async def get_by_id(db: AsyncSession, *, industry_id: uuid.UUID) -> Industry | None:
    return await db.get(Industry, industry_id)


async def get_by_slug(db: AsyncSession, *, slug: str) -> Industry | None:
    return await db.scalar(select(Industry).where(Industry.slug == slug))


async def create(db: AsyncSession, *, name: str, slug: str, parent_id: uuid.UUID | None) -> Industry:
    industry = Industry(name=name, slug=slug, parent_id=parent_id)
    db.add(industry)
    await db.flush()
    return industry


async def delete(db: AsyncSession, *, industry: Industry) -> None:
    await db.delete(industry)
    await db.flush()
