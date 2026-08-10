import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user, require_role
from app.modules.contacts import service
from app.schemas.contact import ContactCreateRequest, ContactResponse, ContactUpdateRequest

router = APIRouter(
    prefix="/api/v1/clients/{client_id}/contacts",
    tags=["contacts"],
)


@router.get("", response_model=list[ContactResponse])
async def list_contacts(
    client_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all contacts (people) associated with a client company."""
    return await service.list_contacts(
        db, org_id=current_user.org_id, user_id=current_user.user_id, client_id=client_id
    )


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    client_id: uuid.UUID,
    payload: ContactCreateRequest,
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new contact at this client company."""
    return await service.create_contact(
        db,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        client_id=client_id,
        payload=payload,
    )


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    client_id: uuid.UUID,
    contact_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch a single contact by ID."""
    return await service.get_contact(
        db,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        client_id=client_id,
        contact_id=contact_id,
    )


@router.patch("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    client_id: uuid.UUID,
    contact_id: uuid.UUID,
    payload: ContactUpdateRequest,
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    """Update a contact. Send only the fields you want to change."""
    return await service.update_contact(
        db,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        client_id=client_id,
        contact_id=contact_id,
        payload=payload,
    )


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    client_id: uuid.UUID,
    contact_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a contact."""
    await service.delete_contact(
        db,
        org_id=current_user.org_id,
        user_id=current_user.user_id,
        client_id=client_id,
        contact_id=contact_id,
    )
