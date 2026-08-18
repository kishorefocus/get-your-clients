"""
Search strategy (per build order: "Postgres/PostGIS first, add Elasticsearch
once basic search works"):

1. Postgres is always the source of truth for geo + structured filters
   (industry, country, city, rating range) and is what runs first.

   Geo filtering here uses a plain Haversine-formula SQL expression over
   `latitude`/`longitude` float columns — no PostGIS extension required.
   A rough bounding box (computed in Python from the requested radius) is
   applied first as a cheap pre-filter that can use the btree indexes on
   those columns, then the exact Haversine distance is computed for
   ordering and the final radius cutoff. This is a full-scan-of-the-bbox
   approach: fine up to roughly hundreds of thousands of rows per
   city/region, not a long-term substitute for PostGIS's GiST index at
   very large scale — see the note in app/models/client.py if you later
   install PostGIS and want to switch to ST_DWithin/ST_Distance.

2. If a `keyword` is present AND Elasticsearch is reachable, we ask ES for a
   ranked list of matching client IDs and use that to *order* the Postgres
   results (ES for relevance, Postgres for correctness/authority). If ES is
   down, we degrade gracefully to a Postgres ILIKE filter instead of failing
   the request — search should survive an ES outage.
3. Pagination is cursor-based (base64 of the last row's sort key), not
   offset-based, since offset pagination gets slow/inconsistent on large,
   frequently-changing tables.
"""

import base64
import json
import math
import uuid
from dataclasses import dataclass

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.modules.clients.repository import _visible_to_org
from app.schemas.client import ClientSearchRequest

EARTH_RADIUS_KM = 6371.0
KM_PER_DEGREE_LAT = 111.32


def _haversine_distance_km_expr(*, lat: float, lng: float):
    """SQLAlchemy expression computing great-circle distance (km) from (lat, lng) to Client.latitude/longitude."""
    lat1 = func.radians(lat)
    lat2 = func.radians(Client.latitude)
    dlat = func.radians(Client.latitude - lat)
    dlng = func.radians(Client.longitude - lng)

    a = func.sin(dlat / 2) * func.sin(dlat / 2) + func.cos(lat1) * func.cos(lat2) * func.sin(dlng / 2) * func.sin(dlng / 2)
    c = 2 * func.atan2(func.sqrt(a), func.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def _bounding_box(*, lat: float, lng: float, radius_km: float) -> tuple[float, float, float, float]:
    """Cheap pre-filter box (min_lat, max_lat, min_lng, max_lng) that fully contains the radius circle."""
    lat_delta = radius_km / KM_PER_DEGREE_LAT
    # Longitude degrees shrink in real distance as you move away from the equator;
    # guard against div-by-zero near the poles.
    km_per_degree_lng = KM_PER_DEGREE_LAT * max(math.cos(math.radians(lat)), 0.01)
    lng_delta = radius_km / km_per_degree_lng
    return lat - lat_delta, lat + lat_delta, lng - lng_delta, lng + lng_delta


@dataclass
class SearchCursor:
    last_distance_m: float | None
    last_id: str

    def encode(self) -> str:
        return base64.urlsafe_b64encode(
            json.dumps({"d": self.last_distance_m, "id": self.last_id}).encode()
        ).decode()

    @classmethod
    def decode(cls, raw: str) -> "SearchCursor":
        payload = json.loads(base64.urlsafe_b64decode(raw.encode()).decode())
        return cls(last_distance_m=payload.get("d"), last_id=payload["id"])


async def search_clients(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    query: ClientSearchRequest,
) -> tuple[list[Client], list[float | None], str | None]:
    """Returns (clients, distance_meters_per_client, next_cursor)."""

    resolved_lat = query.lat
    resolved_lng = query.lng
    resolved_city = query.city
    resolved_country = query.country

    if query.place_id:
        try:
            from app.modules.ingestion.google_places import get_place_details, extract_place_details
            from fastapi import HTTPException, status
            
            details = await get_place_details(query.place_id)
            plat, plng, pcity, pcountry = extract_place_details(details)
            if plat is not None and plng is not None:
                resolved_lat = plat
                resolved_lng = plng
            if pcity:
                resolved_city = pcity
            if pcountry:
                resolved_country = pcountry
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to resolve place_id '{query.place_id}': {exc}"
            )

    filters = [_visible_to_org(org_id)]
    distance_km_expr = None
    distance_m_expr = None

    if resolved_lat is not None and resolved_lng is not None and query.radius_km is not None:
        filters.append(Client.latitude.is_not(None))
        filters.append(Client.longitude.is_not(None))

        min_lat, max_lat, min_lng, max_lng = _bounding_box(lat=resolved_lat, lng=resolved_lng, radius_km=query.radius_km)
        filters.append(Client.latitude.between(min_lat, max_lat))
        filters.append(Client.longitude.between(min_lng, max_lng))

        distance_km_expr = _haversine_distance_km_expr(lat=resolved_lat, lng=resolved_lng)
        filters.append(distance_km_expr <= query.radius_km)
    elif None not in (query.min_lat, query.max_lat, query.min_lng, query.max_lng):
        filters.append(Client.latitude.is_not(None))
        filters.append(Client.longitude.is_not(None))
        filters.append(Client.latitude.between(query.min_lat, query.max_lat))
        filters.append(Client.longitude.between(query.min_lng, query.max_lng))

    if query.industry_id is not None:
        filters.append(Client.industry_id == query.industry_id)
    if resolved_country is not None:
        filters.append(Client.country == resolved_country)
    if resolved_city is not None:
        filters.append(Client.city.ilike(resolved_city))
    if query.min_rating is not None:
        filters.append(Client.rating >= query.min_rating)
    if query.max_rating is not None:
        filters.append(Client.rating <= query.max_rating)

    keyword_ids: list[str] | None = None
    if query.keyword:
        keyword_ids = await _try_elasticsearch_keyword_search(org_id=org_id, keyword=query.keyword)
        if keyword_ids is not None:
            filters.append(Client.id.in_([uuid.UUID(cid) for cid in keyword_ids]))
        else:
            # ES unavailable or returned nothing configured — fall back to Postgres ILIKE
            filters.append(
                or_(Client.name.ilike(f"%{query.keyword}%"), Client.metadata_json["keywords"].astext.ilike(f"%{query.keyword}%"))
            )

    select_cols = [Client]
    if distance_km_expr is not None:
        distance_m_expr = (distance_km_expr * 1000).label("distance_m")
        select_cols.append(distance_m_expr)

    stmt = select(*select_cols).where(and_(*filters))

    if query.cursor:
        cursor = SearchCursor.decode(query.cursor)
        if distance_m_expr is not None and cursor.last_distance_m is not None:
            stmt = stmt.where(
                or_(
                    distance_m_expr > cursor.last_distance_m,
                    and_(distance_m_expr == cursor.last_distance_m, Client.id > uuid.UUID(cursor.last_id)),
                )
            )
        else:
            stmt = stmt.where(Client.id > uuid.UUID(cursor.last_id))

    if distance_m_expr is not None:
        stmt = stmt.order_by(distance_m_expr.asc(), Client.id.asc())
    elif keyword_ids:
        # Preserve ES relevance order (final re-sort by relevance happens below, this is just a DB-level tiebreak)
        stmt = stmt.order_by(Client.id.asc())
    else:
        stmt = stmt.order_by(Client.created_at.desc(), Client.id.asc())

    stmt = stmt.limit(query.limit + 1)  # fetch one extra to know if there's a next page

    rows = (await db.execute(stmt)).all()

    if not rows:
        # If no clients are found in the DB, try to dynamically search Google Places (which falls back to Gemini)
        search_query = query.keyword or ""
        location_parts = []
        if resolved_city:
            location_parts.append(resolved_city)
        if resolved_country:
            location_parts.append(resolved_country)
        location_str = ", ".join(location_parts)

        if search_query and location_str:
            search_query = f"{search_query} in {location_str}"
        elif not search_query and location_str:
            parts = []
            if query.industry_id:
                from app.models.industry import Industry
                industry = await db.get(Industry, query.industry_id)
                if industry:
                    parts.append(industry.name)
            parts.append(location_str)
            search_query = " ".join(parts)
        elif not search_query and query.industry_id:
            from app.models.industry import Industry
            industry = await db.get(Industry, query.industry_id)
            if industry:
                search_query = industry.name

        if search_query:
            try:
                from app.modules.ingestion.google_places import search_places, place_to_client_fields
                from datetime import datetime, timezone

                # Fetch places (which calls Gemini Flash fallback because Google Maps API key is commented out in .env)
                data = await search_places(query=search_query)
                places = data.get("places") or []
                if places:
                    new_client_ids = []
                    for place in places:
                        fields = place_to_client_fields(place)
                        # Check for existing
                        existing = await db.scalar(select(Client).where(Client.source_ref == fields["source_ref"]))
                        if existing is None:
                            client = Client(
                                org_id=org_id,
                                last_verified_at=datetime.now(timezone.utc),
                                **fields
                            )
                            if query.industry_id:
                                client.industry_id = query.industry_id
                            db.add(client)
                            await db.flush()
                            new_client_ids.append(client.id)
                        else:
                            new_client_ids.append(existing.id)
                    await db.commit()

                    if new_client_ids:
                        fallback_filters = [_visible_to_org(org_id), Client.id.in_(new_client_ids)]
                        if resolved_lat is not None and resolved_lng is not None:
                            fallback_filters.extend([Client.latitude.is_not(None), Client.longitude.is_not(None)])
                        
                        fallback_stmt = select(*select_cols).where(and_(*fallback_filters))
                        if distance_m_expr is not None:
                            fallback_stmt = fallback_stmt.order_by(distance_m_expr.asc(), Client.id.asc())
                        else:
                            fallback_stmt = fallback_stmt.order_by(Client.created_at.desc(), Client.id.asc())
                        
                        fallback_stmt = fallback_stmt.limit(query.limit + 1)
                        rows = (await db.execute(fallback_stmt)).all()
            except Exception as e:
                import logging
                logging.getLogger(__name__).exception("Failed to dynamically search and ingest via Gemini: %s", e)

    has_more = len(rows) > query.limit
    rows = rows[: query.limit]

    if distance_m_expr is not None:
        clients = [row[0] for row in rows]
        distances = [row[1] for row in rows]
    else:
        clients = [row[0] for row in rows]
        distances = [None] * len(clients)
        if keyword_ids:
            order_map = {cid: i for i, cid in enumerate(keyword_ids)}
            clients.sort(key=lambda c: order_map.get(str(c.id), len(keyword_ids)))

    next_cursor = None
    if has_more and clients:
        last = clients[-1]
        last_distance = distances[-1] if distances else None
        next_cursor = SearchCursor(last_distance_m=last_distance, last_id=str(last.id)).encode()

    return clients, distances, next_cursor


async def _try_elasticsearch_keyword_search(*, org_id: uuid.UUID, keyword: str) -> list[str] | None:
    """Returns a relevance-ordered list of client IDs, or None if ES is unreachable/unconfigured."""
    try:
        from app.search.es_client import search_client_ids

        return await search_client_ids(org_id=org_id, keyword=keyword)
    except Exception:
        return None
