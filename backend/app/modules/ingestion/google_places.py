"""
Google Places / Geocoding integration.

Compliance note (per Google Maps Platform ToS): Claude cannot verify the
current terms at build time, so before shipping this to production, confirm
against Google's current ToS which Place fields are permitted to be cached
long-term vs. which must be re-fetched live. As a conservative default this
module only persists: name, formatted address, lat/lng, phone, website,
rating, and place_id (kept as `source_ref` so the UI can deep-link back to
Google for full details, which Google's terms generally require of anyone
displaying cached Place data). It does NOT persist photos, reviews text, or
other fields that typically carry stricter caching restrictions.
"""

import httpx

from app.core.config import settings

PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber,places.websiteUri,places.rating,places.types"


async def search_places(*, query: str, page_token: str | None = None) -> dict:
    """One page of Places API (New) Text Search results for a category+location query, e.g. 'restaurants in Austin, TX'."""
    if not settings.google_maps_api_key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not configured")

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.google_maps_api_key,
        "X-Goog-FieldMask": _FIELD_MASK,
    }
    body: dict = {"textQuery": query}
    if page_token:
        body["pageToken"] = page_token

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(PLACES_TEXT_SEARCH_URL, json=body, headers=headers)
        response.raise_for_status()
        return response.json()


def place_to_client_fields(place: dict) -> dict:
    """Maps a Places API (New) place object to our Client model's fields, keeping only permitted-for-cache data."""
    location = place.get("location", {})
    return {
        "name": place.get("displayName", {}).get("text", "Unknown"),
        "address": place.get("formattedAddress"),
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
        "phone": place.get("internationalPhoneNumber"),
        "website": place.get("websiteUri"),
        "rating": place.get("rating"),
        "source": "google_places",
        "source_ref": place.get("id"),  # Google place_id — used to deep-link back for full details
    }


async def geocode_address(address: str) -> tuple[float, float] | None:
    if not settings.google_maps_api_key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not configured")

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            GEOCODE_URL, params={"address": address, "key": settings.google_maps_api_key}
        )
        response.raise_for_status()
        data = response.json()

    results = data.get("results") or []
    if not results:
        return None
    location = results[0]["geometry"]["location"]
    return location["lat"], location["lng"]
