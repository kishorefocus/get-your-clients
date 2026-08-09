import uuid
from functools import lru_cache

from elasticsearch import AsyncElasticsearch

from app.core.config import settings

CLIENTS_INDEX = "clients"

INDEX_MAPPING = {
    "mappings": {
        "properties": {
            "org_id": {"type": "keyword"},
            "name": {"type": "text", "analyzer": "standard"},
            "category": {"type": "keyword"},
            "keywords": {"type": "text"},
            "city": {"type": "keyword"},
            "country": {"type": "keyword"},
        }
    }
}


@lru_cache
def get_es_client() -> AsyncElasticsearch:
    return AsyncElasticsearch(settings.elasticsearch_url, request_timeout=5)


async def ensure_index() -> None:
    es = get_es_client()
    if not await es.indices.exists(index=CLIENTS_INDEX):
        await es.indices.create(index=CLIENTS_INDEX, body=INDEX_MAPPING)


async def index_client(*, client_id: uuid.UUID, org_id: uuid.UUID | None, name: str, category: str | None, city: str | None, country: str | None, keywords: str | None = None) -> None:
    es = get_es_client()
    await es.index(
        index=CLIENTS_INDEX,
        id=str(client_id),
        document={
            "org_id": str(org_id) if org_id else None,
            "name": name,
            "category": category,
            "city": city,
            "country": country,
            "keywords": keywords or "",
        },
    )


async def search_client_ids(*, org_id: uuid.UUID, keyword: str, size: int = 100) -> list[str]:
    """Relevance-ranked client IDs visible to org_id (own org's docs + shared/global docs with org_id null)."""
    es = get_es_client()
    body = {
        "size": size,
        "query": {
            "bool": {
                "must": [{"multi_match": {"query": keyword, "fields": ["name^3", "category", "keywords"]}}],
                "filter": [
                    {
                        "bool": {
                            "should": [
                                {"term": {"org_id": str(org_id)}},
                                {"bool": {"must_not": {"exists": {"field": "org_id"}}}},
                            ]
                        }
                    }
                ],
            }
        },
    }
    result = await es.search(index=CLIENTS_INDEX, body=body)
    return [hit["_id"] for hit in result["hits"]["hits"]]


async def close_es_client() -> None:
    """
    Called from Celery's task wrapper (see app/workers/tasks.py) so the
    cached AsyncElasticsearch client's underlying aiohttp session doesn't
    get reused across a new event loop on the next task, mirroring the
    same fix applied to the SQLAlchemy engine.
    """
    if get_es_client.cache_info().currsize:
        client = get_es_client()
        await client.close()
        get_es_client.cache_clear()
