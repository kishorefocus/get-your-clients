import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user, require_role
from app.modules.tags import service
from app.schemas.tag import TagCreateRequest, TagResponse

router = APIRouter(tags=["tags"])


# ---- Tag CRUD (/api/v1/tags) -------------------------------------------------

@router.get("/api/v1/tags", response_model=list[TagResponse])
async def list_tags(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all tags defined in this organisation."""
    return await service.list_tags(db, org_id=current_user.org_id)


@router.post("/api/v1/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    payload: TagCreateRequest,
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new tag. Name must be unique within the organisation."""
    return await service.create_tag(db, org_id=current_user.org_id, payload=payload)


@router.delete("/api/v1/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a tag. It will be automatically detached from all clients."""
    await service.delete_tag(db, org_id=current_user.org_id, tag_id=tag_id)


# ---- Attach / Detach (/api/v1/clients/{client_id}/tags) ---------------------

@router.post(
    "/api/v1/clients/{client_id}/tags/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["clients"],
)
async def attach_tag(
    client_id: uuid.UUID,
    tag_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    """Attach a tag to a client."""
    await service.attach_tag(db, org_id=current_user.org_id, client_id=client_id, tag_id=tag_id)


@router.delete(
    "/api/v1/clients/{client_id}/tags/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["clients"],
)
async def detach_tag(
    client_id: uuid.UUID,
    tag_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    """Detach a tag from a client."""
    await service.detach_tag(db, org_id=current_user.org_id, client_id=client_id, tag_id=tag_id)
