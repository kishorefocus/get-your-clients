import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class ClientCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=500)
    industry_id: uuid.UUID | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = Field(default=None, min_length=2, max_length=2)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    metadata: dict = Field(default_factory=dict)

    @model_validator(mode="after")
    def lat_lng_together(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class ClientUpdateRequest(BaseModel):
    name: str | None = None
    industry_id: uuid.UUID | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    metadata: dict | None = None
    consent_status: str | None = None


class ClientTagResponse(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}


class ClientResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID | None
    name: str
    industry_id: uuid.UUID | None
    address: str | None
    city: str | None
    country: str | None
    latitude: float | None
    longitude: float | None
    phone: str | None
    email: str | None
    website: str | None
    rating: float | None
    source: str
    last_verified_at: datetime | None
    consent_status: str
    distance_meters: float | None = None  # populated only by geo search
    tags: list[ClientTagResponse] = []

    model_config = {"from_attributes": True}


class ClientSearchRequest(BaseModel):
    keyword: str | None = None
    industry_id: uuid.UUID | None = None
    country: str | None = None
    city: str | None = None
    place_id: str | None = None

    # Radius search
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    radius_km: float | None = Field(default=None, gt=0, le=500)

    # Bounding box search (alternative to radius)
    min_lat: float | None = None
    max_lat: float | None = None
    min_lng: float | None = None
    max_lng: float | None = None

    min_rating: float | None = Field(default=None, ge=0, le=5)
    max_rating: float | None = Field(default=None, ge=0, le=5)

    cursor: str | None = None  # opaque cursor, see clients/search.py
    limit: int = Field(default=25, ge=1, le=100)

    @model_validator(mode="after")
    def validate_geo_params(self):
        if self.radius_km is not None and self.place_id is None and (self.lat is None or self.lng is None):
            raise ValueError("radius_km requires either place_id or lat and lng to be provided")
        if self.lat is not None or self.lng is not None:
            if self.lat is None or self.lng is None or self.radius_km is None:
                raise ValueError("lat, lng, and radius_km must all be provided together for radius search")
        return self


class ClientSearchResponse(BaseModel):
    results: list[ClientResponse]
    next_cursor: str | None
