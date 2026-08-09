"""
Celery tasks are synchronous entry points; each one opens its own event loop
to drive the async DB/HTTP calls, since Celery workers don't run an asyncio
loop for you. Keep tasks idempotent where possible (e.g. dedupe-by-source_ref
before insert) since task_acks_late + worker crashes can cause redelivery.
"""

import asyncio
import uuid
from datetime import datetime, timezone

from celery.utils.log import get_task_logger

from app.core.database import AsyncSessionLocal, engine
from app.workers.celery_app import celery_app

logger = get_task_logger(__name__)


def _run(coro):
    """
    Each Celery task invocation gets its own asyncio event loop via
    asyncio.run(). The async SQLAlchemy engine's connection pool is a
    module-level singleton, though, and asyncpg connections are bound to
    the event loop that created them — reusing a pooled connection from a
    previous task's (now-closed) loop raises "Future attached to a
    different loop". Disposing the pool after every task forces the next
    task to open fresh connections on its own loop instead of reusing
    stale ones.
    """

    async def _wrapped():
        try:
            return await coro
        finally:
            await engine.dispose()
            from app.search.es_client import close_es_client

            try:
                await close_es_client()
            except Exception:
                pass  # best-effort cleanup; never let this mask the task's real result

    return asyncio.run(_wrapped())


@celery_app.task(name="app.workers.tasks.import_csv_rows", bind=True, max_retries=2)
def import_csv_rows(self, *, org_id: str, rows: list[dict], source_filename: str | None, parse_warnings: list[str]):
    return _run(_import_csv_rows(org_id=org_id, rows=rows, source_filename=source_filename))


async def _import_csv_rows(*, org_id: str, rows: list[dict], source_filename: str | None) -> dict:
    from app.models.client import Client
    from app.modules.ingestion.dedupe import find_duplicate
    from app.modules.ingestion.google_places import geocode_address

    created, merged, failed = 0, 0, 0

    async with AsyncSessionLocal() as db:
        for row in rows:
            try:
                duplicate = await find_duplicate(
                    db, org_id=uuid.UUID(org_id), name=row["name"], address=row.get("address"), city=row.get("city")
                )
                if duplicate is not None:
                    merged += 1
                    continue  # policy choice: skip: a future pass could merge missing fields onto `duplicate` instead

                lat, lng = None, None
                if row.get("address"):
                    try:
                        coords = await geocode_address(row["address"])
                        if coords:
                            lat, lng = coords
                    except Exception as exc:  # noqa: BLE001 — geocoding failures shouldn't fail the whole row
                        logger.warning("Geocode failed for %r: %s", row.get("address"), exc)

                client = Client(
                    org_id=uuid.UUID(org_id),
                    name=row["name"],
                    address=row.get("address"),
                    city=row.get("city"),
                    country=row.get("country"),
                    phone=row.get("phone"),
                    email=row.get("email"),
                    website=row.get("website"),
                    latitude=lat,
                    longitude=lng,
                    source=f"csv_import:{source_filename or 'unknown'}",
                    last_verified_at=datetime.now(timezone.utc),
                )
                db.add(client)
                await db.flush()

                if lat is not None and lng is not None:
                    from sqlalchemy import text

                    await db.execute(
                        text("UPDATE clients SET location = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography WHERE id = :id"),
                        {"lng": lng, "lat": lat, "id": str(client.id)},
                    )

                created += 1
            except Exception as exc:  # noqa: BLE001 — one bad row shouldn't abort the batch
                logger.error("Failed to import row %r: %s", row, exc)
                failed += 1

        await db.commit()

    # Index newly created rows into Elasticsearch (best-effort; search still works via Postgres if this fails)
    try:
        from app.search.indexer import reindex_org

        await reindex_org(org_id=uuid.UUID(org_id))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Elasticsearch reindex after import failed (non-fatal): %s", exc)

    return {"created": created, "merged": merged, "failed": failed}


@celery_app.task(name="app.workers.tasks.refresh_places_grid")
def refresh_places_grid(*, query: str):
    """Batch-refreshes one category+location grid cell from Google Places. Call per cell from beat/admin trigger."""
    return _run(_refresh_places_grid(query=query))


async def _refresh_places_grid(*, query: str) -> dict:
    from app.models.client import Client
    from app.modules.ingestion.google_places import place_to_client_fields, search_places
    from sqlalchemy import select

    imported = 0
    page_token = None
    async with AsyncSessionLocal() as db:
        while True:
            data = await search_places(query=query, page_token=page_token)
            for place in data.get("places", []):
                fields = place_to_client_fields(place)
                existing = await db.scalar(select(Client).where(Client.source_ref == fields["source_ref"]))
                if existing is not None:
                    for key, value in fields.items():
                        setattr(existing, key, value)
                    existing.last_verified_at = datetime.now(timezone.utc)
                else:
                    db.add(Client(org_id=None, last_verified_at=datetime.now(timezone.utc), **fields))
                    imported += 1
            await db.commit()

            page_token = data.get("nextPageToken")
            if not page_token:
                break
    return {"imported_or_refreshed": imported}


@celery_app.task(name="app.workers.tasks.check_due_reminders")
def check_due_reminders():
    return _run(_check_due_reminders())


async def _check_due_reminders() -> int:
    from sqlalchemy import select

    from app.models.reminder import Reminder

    dispatched = 0
    async with AsyncSessionLocal() as db:
        due = await db.scalars(
            select(Reminder).where(Reminder.is_done.is_(False), Reminder.due_at <= datetime.now(timezone.utc))
        )
        for reminder in due:
            dispatch_reminder.delay(reminder_id=str(reminder.id))
            dispatched += 1
    return dispatched


@celery_app.task(name="app.workers.tasks.dispatch_reminder")
def dispatch_reminder(*, reminder_id: str):
    """
    Notification fan-out stub: push to the in-app notification channel (Redis
    pub/sub, same pattern as chat) and/or email. Wire to your notification
    delivery module once it exists — left as a stub here since the spec's
    build order puts notifications after core CRM flows.
    """
    logger.info("Reminder %s is due", reminder_id)


@celery_app.task(name="app.workers.tasks.send_outreach_email_step")
def send_outreach_email_step(*, org_id: str, client_id: str, contact_id: str, template_id: str):
    """
    Stub for outreach-sequence email dispatch via SendGrid/Postmark. Not
    implemented in this scaffold: sending real outreach email requires
    per-org sender domain verification, unsubscribe-link injection, and
    bounce/open webhook wiring, which are product decisions best made
    alongside whichever provider you pick — see README "What's stubbed".
    """
    raise NotImplementedError("Wire this up to your chosen email provider's API")
