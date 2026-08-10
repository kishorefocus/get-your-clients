import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.industry import Industry
from app.modules.industries import repository
from app.schemas.industry import IndustryCreateRequest, IndustryResponse, IndustryTreeNode


async def list_industries(
    db: AsyncSession, *, parent_id: uuid.UUID | None = None
) -> list[Industry]:
    return await repository.list_all(db, parent_id=parent_id)


async def get_tree(db: AsyncSession) -> list[IndustryTreeNode]:
    """
    Build a full recursive tree from all industries.
    Fetches all rows in one query then assembles in-memory — efficient
    for the expected scale of a taxonomy (hundreds, not millions).
    """
    all_industries = await repository.list_all(db)

    # Index by id for O(1) parent lookup
    by_id: dict[uuid.UUID, IndustryTreeNode] = {
        ind.id: IndustryTreeNode(
            id=ind.id,
            name=ind.name,
            slug=ind.slug,
            parent_id=ind.parent_id,
        )
        for ind in all_industries
    }

    roots: list[IndustryTreeNode] = []
    for node in by_id.values():
        if node.parent_id is None:
            roots.append(node)
        elif node.parent_id in by_id:
            by_id[node.parent_id].children.append(node)

    # Sort children alphabetically at each level
    def _sort(nodes: list[IndustryTreeNode]) -> list[IndustryTreeNode]:
        nodes.sort(key=lambda n: n.name)
        for n in nodes:
            n.children = _sort(n.children)
        return nodes

    return _sort(roots)


async def create_industry(
    db: AsyncSession, *, payload: IndustryCreateRequest
) -> Industry:
    # Enforce slug uniqueness with a helpful error
    existing = await repository.get_by_slug(db, slug=payload.slug)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An industry with slug '{payload.slug}' already exists",
        )
    if payload.parent_id is not None:
        parent = await repository.get_by_id(db, industry_id=payload.parent_id)
        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Parent industry not found"
            )
    industry = await repository.create(
        db, name=payload.name, slug=payload.slug, parent_id=payload.parent_id
    )
    await db.commit()
    await db.refresh(industry)
    return industry


async def delete_industry(db: AsyncSession, *, industry_id: uuid.UUID) -> None:
    industry = await repository.get_by_id(db, industry_id=industry_id)
    if industry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Industry not found")
    await repository.delete(db, industry=industry)
    await db.commit()
