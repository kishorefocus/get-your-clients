import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user, require_role
from app.modules.industries import service
from app.schemas.industry import IndustryCreateRequest, IndustryResponse, IndustryTreeNode

router = APIRouter(prefix="/api/v1/industries", tags=["industries"])


@router.get("", response_model=list[IndustryResponse])
async def list_industries(
    parent_id: uuid.UUID | None = Query(default=None, description="Filter to children of this parent"),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Flat list of industries. Pass `?parent_id=<uuid>` to retrieve children of a
    specific node — useful for lazy-loading a hierarchical picker.
    Omit `parent_id` to get all rows (good for simple dropdowns).
    """
    return await service.list_industries(db, parent_id=parent_id)


@router.get("/tree", response_model=list[IndustryTreeNode])
async def get_industry_tree(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Full recursive industry tree (all levels). Children are nested under
    `children`. Suitable for rendering a full picker or sidebar tree.
    """
    return await service.get_tree(db)


@router.post("", response_model=IndustryResponse, status_code=status.HTTP_201_CREATED)
async def create_industry(
    payload: IndustryCreateRequest,
    current_user: CurrentUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new industry node. Admin only."""
    return await service.create_industry(db, payload=payload)


@router.delete("/{industry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_industry(
    industry_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an industry node. Admin only.
    Child nodes will have their parent_id set to NULL (CASCADE SET NULL).
    """
    await service.delete_industry(db, industry_id=industry_id)
