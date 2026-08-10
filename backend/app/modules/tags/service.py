import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tag import Tag
from app.modules.tags import repository
from app.schemas.tag import TagCreateRequest


async def list_tags(db: AsyncSession, *, org_id: uuid.UUID) -> list[Tag]:
    return await repository.list_for_org(db, org_id=org_id)


async def create_tag(
    db: AsyncSession, *, org_id: uuid.UUID, payload: TagCreateRequest
) -> Tag:
    # Enforce name uniqueness per org
    existing = await repository.get_by_name(db, org_id=org_id, name=payload.name)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tag '{payload.name}' already exists in this organisation",
        )
    tag = await repository.create(db, org_id=org_id, name=payload.name)
    await db.commit()
    await db.refresh(tag)
    return tag


async def delete_tag(db: AsyncSession, *, org_id: uuid.UUID, tag_id: uuid.UUID) -> None:
    tag = await repository.get_by_id(db, org_id=org_id, tag_id=tag_id)
    if tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    await repository.delete(db, tag=tag)
    await db.commit()


async def attach_tag(
    db: AsyncSession, *, org_id: uuid.UUID, client_id: uuid.UUID, tag_id: uuid.UUID
) -> None:
    tag = await repository.get_by_id(db, org_id=org_id, tag_id=tag_id)
    if tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    await repository.attach(db, client_id=client_id, tag_id=tag_id)
    await db.commit()


async def detach_tag(
    db: AsyncSession, *, org_id: uuid.UUID, client_id: uuid.UUID, tag_id: uuid.UUID
) -> None:
    tag = await repository.get_by_id(db, org_id=org_id, tag_id=tag_id)
    if tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    await repository.detach(db, client_id=client_id, tag_id=tag_id)
    await db.commit()
