import uuid

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.client import Client
from app.models.industry import Industry
from app.search.es_client import ensure_index, index_client


async def reindex_org(*, org_id: uuid.UUID) -> int:
    """Full reindex of one org's clients (plus the shared/global dataset it can see). Fine at moderate scale;
    for very large orgs switch to the ES bulk helper instead of one index() call per doc."""
    await ensure_index()

    count = 0
    async with AsyncSessionLocal() as db:
        from sqlalchemy import or_

        rows = (
            await db.execute(
                select(Client, Industry.name)
                .join(Industry, Industry.id == Client.industry_id, isouter=True)
                .where(or_(Client.org_id == org_id, Client.org_id.is_(None)))
            )
        ).all()

        for client, industry_name in rows:
            keywords = " ".join(filter(None, [client.website, client.metadata_json.get("keywords") if isinstance(client.metadata_json, dict) else None]))
            await index_client(
                client_id=client.id,
                org_id=client.org_id,
                name=client.name,
                category=industry_name,
                city=client.city,
                country=client.country,
                keywords=keywords,
            )
            count += 1

    return count
