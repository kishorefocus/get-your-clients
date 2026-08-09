"""
Fuzzy dedupe for the ingestion pipeline: raw record -> geocode -> industry
classification -> dedupe -> index into Elasticsearch.

Exact-match dedupe (same source_ref, or same normalized phone) is cheap and
handled in SQL before this ever runs; this module is for the harder case of
"is this CSV row the same business as an existing row with slightly
different name/address spelling".
"""

import re
import uuid

from rapidfuzz import fuzz
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client

_WHITESPACE_RE = re.compile(r"\s+")
_PUNCTUATION_RE = re.compile(r"[^\w\s]")


def _normalize(text: str | None) -> str:
    if not text:
        return ""
    text = text.lower()
    text = _PUNCTUATION_RE.sub("", text)
    text = _WHITESPACE_RE.sub(" ", text).strip()
    return text


async def find_duplicate(
    db: AsyncSession,
    *,
    org_id: uuid.UUID | None,
    name: str,
    address: str | None,
    city: str | None,
    similarity_threshold: int = 87,
) -> Client | None:
    """
    Candidate generation: narrow to same city (cheap, indexed) then fuzzy-score
    name+address in Python. Good enough at moderate per-city volumes; if a
    single city grows past ~50k records, replace this with a trigram
    similarity query (pg_trgm) run in Postgres instead of pulling candidates
    into the app.
    """
    if not city:
        return None

    stmt = select(Client).where(Client.city.ilike(city))
    if org_id is not None:
        from sqlalchemy import or_

        stmt = stmt.where(or_(Client.org_id == org_id, Client.org_id.is_(None)))
    candidates = (await db.scalars(stmt)).all()

    target_key = f"{_normalize(name)} {_normalize(address)}"
    best_match: Client | None = None
    best_score = 0.0

    for candidate in candidates:
        candidate_key = f"{_normalize(candidate.name)} {_normalize(candidate.address)}"
        score = fuzz.token_sort_ratio(target_key, candidate_key)
        if score > best_score:
            best_score, best_match = score, candidate

    return best_match if best_score >= similarity_threshold else None
