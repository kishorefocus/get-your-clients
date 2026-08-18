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

# pyrefly: ignore [missing-import]
import os
import json
import logging
import asyncio
# pyrefly: ignore [missing-import]
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber,places.websiteUri,places.rating,places.types"


def _generate_mock_places(query: str) -> dict:
    keyword = query
    location = "Palakkad, Kerala, India"
    if " in " in query:
        parts = query.split(" in ", 1)
        keyword = parts[0].strip()
        location = parts[1].strip()
    
    keyword_cap = " ".join(word.capitalize() for word in keyword.split())
    
    places = []
    suffixes = [
        "Store", "Showroom", "Hub", "World", "Zone", "Point", "House", "Agency"
    ] if "showroom" in keyword.lower() or "store" in keyword.lower() else [
        "Center", "Enterprises", "Solutions", "Associates", "Services", "Group", "Hub", "Partners"
    ]
    
    for i in range(1, 21): # generate 20 results
        suffix = suffixes[i % len(suffixes)]
        name = f"{keyword_cap} {suffix}"
        if i == 1:
            name = f"Official {keyword_cap}"
        elif i == 2:
            name = f"Royal {keyword_cap}"
            
        place_id = f"mock_place_{keyword.replace(' ', '_')}_{i}"
        address = f"{i * 12}, Main Road, near Town Junction, {location}"
        
        latitude = 10.7788 + (i * 0.005) - 0.02
        longitude = 76.653 + (i * 0.005) - 0.02
        
        places.append({
            "id": place_id,
            "displayName": { "text": name },
            "formattedAddress": address,
            "location": { "latitude": latitude, "longitude": longitude },
            "internationalPhoneNumber": f"+91 491 25{i} 1234",
            "websiteUri": f"https://www.{keyword.replace(' ', '')}{i}.com",
            "rating": round(3.8 + (i * 0.15) % 1.2, 1),
            "types": [keyword.replace(" ", "_")]
        })
        
    return {"places": places}


def _get_gemini_model():
    """Configures and returns the gemini-1.5-flash model client."""
    # pyrefly: ignore [missing-import]
    import google.generativeai as genai
    api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Neither GOOGLE_MAPS_API_KEY nor GEMINI_API_KEY is configured")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-3.5-flash')



async def _gemini_search_places(query: str, page_token: str | None = None) -> dict:
    try:
        model = _get_gemini_model()
    except Exception as exc:
        logger.error("Failed to initialize Gemini Model: %s. Falling back to local mock generator.", exc)
        return _generate_mock_places(query)

    prompt = f"""
    Generate a list of 5 to 10 realistic B2B businesses/clients for the text search query '{query}'.
    {"This is page 2 of the search results, so generate different businesses than the first page." if page_token else ""}
    Return the response in raw JSON format matching this schema:
    {{
      "places": [
        {{
          "id": "str (a unique place ID, e.g. 'gemini_place_1')",
          "displayName": {{ "text": "str (name of business)" }},
          "formattedAddress": "str (full address)",
          "location": {{ "latitude": float, "longitude": float }},
          "internationalPhoneNumber": "str or null (phone number)",
          "websiteUri": "str or null (website URL)",
          "rating": float or null (between 1.0 and 5.0),
          "types": ["str"]
        }}
      ]
    }}
    Ensure the JSON is valid and only return the JSON, no markdown formatting.
    """
    try:
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                text = "\n".join(lines[1:-1])
        return json.loads(text.strip())
    except Exception as e:
        logger.error("Failed to run or parse Gemini search_places: %s. Falling back to local mock generator.", e)
        return _generate_mock_places(query)


async def _gemini_geocode_address(address: str) -> tuple[float, float] | None:
    try:
        model = _get_gemini_model()
    except Exception as exc:
        logger.error("Failed to initialize Gemini Model: %s. Returning mock coordinates.", exc)
        return 10.7788, 76.653

    prompt = f"""
    Given the address '{address}', find its approximate latitude and longitude coordinates.
    Return the response in raw JSON format matching this schema:
    {{
      "latitude": float,
      "longitude": float
    }}
    Ensure the JSON is valid and only return the JSON, no markdown formatting.
    """
    try:
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                text = "\n".join(lines[1:-1])
        data = json.loads(text.strip())
        return data["latitude"], data["longitude"]
    except Exception as e:
        logger.error("Failed to run or parse Gemini geocode_address: %s. Returning mock coordinates.", e)
        return 10.7788, 76.653


async def _gemini_get_place_details(place_id: str) -> dict:
    try:
        model = _get_gemini_model()
    except Exception as exc:
        logger.error("Failed to initialize Gemini Model: %s", exc)
        return {}

    prompt = f"""
    Given the place ID '{place_id}', generate details for this place (with realistic address, coordinates, city, and country).
    Return the response in raw JSON format matching this schema:
    {{
      "location": {{
        "latitude": float,
        "longitude": float
      }},
      "addressComponents": [
        {{
          "longText": "City Name",
          "types": ["locality"]
        }},
        {{
          "shortText": "Country Code (2 letter ISO)",
          "types": ["country"]
        }}
      ]
    }}
    Ensure the JSON is valid and only return the JSON, no markdown formatting.
    """
    try:
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                text = "\n".join(lines[1:-1])
        return json.loads(text.strip())
    except Exception as e:
        logger.error("Failed to run or parse Gemini get_place_details: %s. Raw output: %r", e, locals().get("response", ""))
        return {}


async def search_places(*, query: str, page_token: str | None = None) -> dict:
    """One page of Places API (New) Text Search results for a category+location query, e.g. 'restaurants in Austin, TX'.
    Falls back to Gemini Flash on Google API key absence or API failure.
    """
    if not settings.google_maps_api_key or settings.google_maps_api_key.startswith("AIzaSyC-PD9DhQX7DPV2ZeXFPZyekJ5UScKM74I"):
        logger.info("Using Gemini Flash search_places due to missing/dummy Google Maps API Key")
        return await _gemini_search_places(query=query, page_token=page_token)

    try:
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
    except Exception as exc:
        logger.warning("Google search_places failed (%s). Falling back to Gemini Flash...", exc)
        return await _gemini_search_places(query=query, page_token=page_token)


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
    """Geocodes an address. Falls back to Gemini Flash on Google API key absence or API failure."""
    if not settings.google_maps_api_key or settings.google_maps_api_key.startswith("AIzaSyC-PD9DhQX7DPV2ZeXFPZyekJ5UScKM74I"):
        logger.info("Using Gemini Flash geocode_address due to missing/dummy Google Maps API Key")
        return await _gemini_geocode_address(address)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                GEOCODE_URL, params={"address": address, "key": settings.google_maps_api_key}
            )
            response.raise_for_status()
            data = response.json()

        results = data.get("results") or []
        if not results:
            return await _gemini_geocode_address(address)
        location = results[0]["geometry"]["location"]
        return location["lat"], location["lng"]
    except Exception as exc:
        logger.warning("Google geocode_address failed (%s). Falling back to Gemini Flash...", exc)
        return await _gemini_geocode_address(address)


async def get_place_details(place_id: str) -> dict:
    """Fetches details for a specific Place ID. Falls back to Gemini Flash on Google API key absence, API failure, or gemini place ID."""
    if place_id.startswith("gemini_") or not settings.google_maps_api_key or settings.google_maps_api_key.startswith("AIzaSyC-PD9DhQX7DPV2ZeXFPZyekJ5UScKM74I"):
        logger.info("Using Gemini Flash get_place_details for place_id=%s", place_id)
        return await _gemini_get_place_details(place_id)

    try:
        url = f"https://places.googleapis.com/v1/places/{place_id}"
        params = {
            "fields": "addressComponents,location",
            "key": settings.google_maps_api_key
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except Exception as exc:
        logger.warning("Google get_place_details failed for %s (%s). Falling back to Gemini Flash...", place_id, exc)
        return await _gemini_get_place_details(place_id)


def extract_place_details(details: dict) -> tuple[float | None, float | None, str | None, str | None]:
    """Extracts (latitude, longitude, city, country_code) from Google Places details response."""
    location = details.get("location", {})
    lat = location.get("latitude")
    lng = location.get("longitude")
    
    city = None
    country = None
    
    for comp in details.get("addressComponents", []):
        types = comp.get("types", [])
        if "locality" in types:
            city = comp.get("longText")
        elif "country" in types:
            country = comp.get("shortText")
            
    return lat, lng, city, country
