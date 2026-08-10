import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user
from app.modules.saved_searches import service
from app.schemas.saved_search import (
    SavedSearchCreateRequest,
    SavedSearchResponse,
    SavedSearchUpdateRequest,
)

router = APIRouter(prefix="/api/v1/saved-searches", tags=["saved-searches"])


@router.get("", response_model=list[SavedSearchResponse])
async def list_saved_searches(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all saved searches belonging to the current user."""
    return await service.list_searches(
        db, org_id=current_user.org_id, user_id=current_user.user_id
    )


@router.post("", response_model=SavedSearchResponse, status_code=status.HTTP_201_CREATED)
async def create_saved_search(
    payload: SavedSearchCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a named client search filter for later replay."""
    return await service.create_search(
        db, org_id=current_user.org_id, user_id=current_user.user_id, payload=payload
    )


@router.patch("/{search_id}", response_model=SavedSearchResponse)
async def update_saved_search(
    search_id: uuid.UUID,
    payload: SavedSearchUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the name or query of a saved search."""
    return await service.update_search(
        db,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        search_id=search_id,
        payload=payload,
    )


@router.delete("/{search_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_search(
    search_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a saved search. Only the owner can delete their own searches."""
    await service.delete_search(
        db, org_id=current_user.org_id, user_id=current_user.user_id, search_id=search_id
    )
