import csv
import io
import uuid

_ALLOWED_COLUMNS = {"name", "address", "city", "country", "phone", "email", "website"}


def parse_and_validate(contents: bytes) -> tuple[list[dict], list[str]]:
    """
    Returns (valid_rows, errors). Validation here is intentionally light —
    the real per-row validation (geocode success, dedupe, industry
    classification) happens asynchronously in the Celery task since it
    involves network calls; this pass just rejects obviously malformed rows
    so we don't enqueue thousands of empty records.
    """
    errors: list[str] = []
    valid_rows: list[dict] = []

    try:
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        return [], ["File is not valid UTF-8 text"]

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        return [], ["CSV has no header row"]

    unknown_columns = set(reader.fieldnames) - _ALLOWED_COLUMNS
    if unknown_columns:
        errors.append(f"Ignoring unrecognized columns: {', '.join(sorted(unknown_columns))}")

    for i, row in enumerate(reader, start=2):  # header is row 1
        name = (row.get("name") or "").strip()
        if not name:
            errors.append(f"Row {i}: missing required 'name' column, skipped")
            continue
        valid_rows.append({k: (row.get(k) or "").strip() or None for k in _ALLOWED_COLUMNS})

    return valid_rows, errors


async def stage_upload_and_enqueue(*, org_id: uuid.UUID, filename: str | None, contents: bytes) -> str:
    """
    Validates synchronously (cheap, no I/O) then hands the row list to
    Celery for the expensive per-row work. Returns the Celery task id so the
    caller can poll /api/v1/tasks/{task_id} (not implemented in this
    scaffold — wire up celery.result.AsyncResult there, or switch to
    publishing progress over the org's chat/notifications channel).
    """
    rows, errors = parse_and_validate(contents)

    from app.workers.tasks import import_csv_rows

    task = import_csv_rows.delay(org_id=str(org_id), rows=rows, source_filename=filename, parse_warnings=errors)
    return task.id
