import uuid

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rate_limit import RateLimitExceeded, enforce_rate_limit
from app.modules.auth.dependencies import CurrentUser, get_current_user, require_role
from app.modules.clients import service
from app.schemas.client import (
    ClientCreateRequest,
    ClientResponse,
    ClientSearchRequest,
    ClientSearchResponse,
    ClientUpdateRequest,
)
from fastapi import HTTPException, status

router = APIRouter(prefix="/api/v1/clients", tags=["clients"])


def _to_response(client, distance_meters: float | None = None) -> ClientResponse:
    resp = ClientResponse.model_validate(client)
    resp.distance_meters = distance_meters
    return resp


@router.post("/search", response_model=ClientSearchResponse)
async def search_clients(
    query: ClientSearchRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    clients, distances, next_cursor = await service.search(
        db, org_id=current_user.org_id, user_id=current_user.user_id, query=query
    )
    return ClientSearchResponse(
        results=[_to_response(c, d) for c, d in zip(clients, distances)],
        next_cursor=next_cursor,
    )


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client = await service.get_client(db, org_id=current_user.org_id, user_id=current_user.user_id, client_id=client_id)
    return _to_response(client)


@router.post("", response_model=ClientResponse, status_code=201)
async def create_client(
    payload: ClientCreateRequest,
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    client = await service.create_client(db, org_id=current_user.org_id, user_id=current_user.user_id, payload=payload)
    return _to_response(client)


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: uuid.UUID,
    payload: ClientUpdateRequest,
    current_user: CurrentUser = Depends(require_role("rep")),
    db: AsyncSession = Depends(get_db),
):
    client = await service.update_client(
        db, org_id=current_user.org_id, user_id=current_user.user_id, client_id=client_id, payload=payload
    )
    return _to_response(client)


@router.delete("/{client_id}", status_code=204)
async def delete_client(
    client_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
):
    await service.delete_client(db, org_id=current_user.org_id, user_id=current_user.user_id, client_id=client_id)


@router.post("/import/csv", status_code=202)
async def import_csv(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_role("manager")),
):
    """
    Enqueues the uploaded file for background validate/dedupe/geocode
    processing (see app.modules.ingestion.csv_import + app.workers.tasks).
    Bulk import is rate-limited per org since each row can trigger a
    geocoding API call.
    """
    try:
        await enforce_rate_limit(key=f"ratelimit:org:{current_user.org_id}:csv_import", limit=5, window_seconds=3600)
    except RateLimitExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many imports; retry after {exc.retry_after_seconds}s",
        ) from exc

    from app.modules.ingestion.csv_import import stage_upload_and_enqueue

    contents = await file.read()
    task_id = await stage_upload_and_enqueue(org_id=current_user.org_id, filename=file.filename, contents=contents)
    return {"task_id": task_id, "status": "queued"}
