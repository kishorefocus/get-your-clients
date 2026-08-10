import uuid

from sqlalchemy import delete as sa_delete, insert as sa_insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tag import Tag, client_tags


async def list_for_org(db: AsyncSession, *, org_id: uuid.UUID) -> list[Tag]:
    result = await db.scalars(
        select(Tag).where(Tag.org_id == org_id).order_by(Tag.name.asc())
    )
    return list(result)


async def get_by_id(db: AsyncSession, *, org_id: uuid.UUID, tag_id: uuid.UUID) -> Tag | None:
    return await db.scalar(
        select(Tag).where(Tag.id == tag_id, Tag.org_id == org_id)
    )


async def get_by_name(db: AsyncSession, *, org_id: uuid.UUID, name: str) -> Tag | None:
    return await db.scalar(
        select(Tag).where(Tag.org_id == org_id, Tag.name == name)
    )


async def create(db: AsyncSession, *, org_id: uuid.UUID, name: str) -> Tag:
    tag = Tag(org_id=org_id, name=name)
    db.add(tag)
    await db.flush()
    return tag


async def delete(db: AsyncSession, *, tag: Tag) -> None:
    await db.delete(tag)
    await db.flush()


# ---- attach / detach via association table (avoids loading the full tags list) -------

async def attach(db: AsyncSession, *, client_id: uuid.UUID, tag_id: uuid.UUID) -> None:
    """Insert into client_tags. Silently ignores if already present."""
    try:
        await db.execute(
            sa_insert(client_tags).values(client_id=client_id, tag_id=tag_id)
        )
        await db.flush()
    except IntegrityError:
        # Already attached — treat as no-op
        await db.rollback()


async def detach(db: AsyncSession, *, client_id: uuid.UUID, tag_id: uuid.UUID) -> None:
    """Delete from client_tags."""
    await db.execute(
        sa_delete(client_tags).where(
            client_tags.c.client_id == client_id,
            client_tags.c.tag_id == tag_id,
        )
    )
    await db.flush()
