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


def _to_response(
    client, distance_meters: float | None = None, is_locked: bool = False
) -> ClientResponse:
    resp = ClientResponse.model_validate(client)
    resp.distance_meters = distance_meters
    resp.is_locked = is_locked
    if is_locked:
        resp.phone = "Locked (Pro Feature)"
        resp.email = "Locked (Pro Feature)"
        resp.website = "Locked (Pro Feature)"
        resp.address = f"Locked Street, {client.city or ''}, {client.country or ''}".strip(", ")
        resp.latitude = None
        resp.longitude = None
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

    from app.models.organization import Organization
    from app.models.pipeline import ClientPipelineState
    from sqlalchemy import select

    org = await db.get(Organization, current_user.org_id)
    is_free = (org.plan == "free") if org else True

    # Query all pipeline states for this org to check claimed clients
    claimed_stmt = select(ClientPipelineState.client_id).where(
        ClientPipelineState.org_id == current_user.org_id
    )
    claimed_ids_res = await db.scalars(claimed_stmt)
    claimed_ids = set(claimed_ids_res.all())

    results = []
    for idx, (c, d) in enumerate(zip(clients, distances)):
        is_global = c.org_id != current_user.org_id
        is_claimed = c.id in claimed_ids
        c_locked = is_free and is_global and not is_claimed and idx >= 3
        results.append(_to_response(c, d, is_locked=c_locked))

    return ClientSearchResponse(
        results=results,
        next_cursor=next_cursor,
    )


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client = await service.get_client(db, org_id=current_user.org_id, user_id=current_user.user_id, client_id=client_id)

    from app.models.organization import Organization
    from app.models.pipeline import ClientPipelineState
    from sqlalchemy import select

    org = await db.get(Organization, current_user.org_id)
    is_free = (org.plan == "free") if org else True

    is_global = client.org_id != current_user.org_id

    # Check if claimed in pipeline
    claimed = False
    if is_global:
        claimed_stmt = select(ClientPipelineState).where(
            ClientPipelineState.org_id == current_user.org_id,
            ClientPipelineState.client_id == client.id
        )
        res = await db.scalar(claimed_stmt)
        claimed = res is not None

    c_locked = is_free and is_global and not claimed
    return _to_response(client, is_locked=c_locked)


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
    except Exception:
        pass  # Redis unreachable locally — see note in middleware/rate_limit_middleware.py

    from app.modules.ingestion.csv_import import stage_upload_and_enqueue

    contents = await file.read()
    task_id = await stage_upload_and_enqueue(org_id=current_user.org_id, filename=file.filename, contents=contents)
    return {"task_id": task_id, "status": "queued"}
