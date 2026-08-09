import uuid
from enum import StrEnum

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class ConsentStatus(StrEnum):
    """Per-contact consent tracking for outreach compliance (GDPR / TCPA-style rules)."""

    UNKNOWN = "unknown"
    OPTED_IN = "opted_in"
    OPTED_OUT = "opted_out"


class Client(UUIDPKMixin, TimestampMixin, Base):
    """
    The target business/lead. org_id is nullable: a NULL org_id row is part of
    a shared global dataset (e.g. sourced from Google Places) that any org can
    discover via search but not edit; orgs "claim" a client into their own
    pipeline by creating pipeline/interaction rows referencing it, not by
    mutating the shared record.

    Geospatial search runs off plain latitude/longitude floats using a
    Haversine-formula SQL expression (see app/modules/clients/search.py) so
    this works on any vanilla Postgres install with no extensions required.
    If you later install PostGIS, swap these two columns for a `geography`
    column and use ST_DWithin/ST_Distance instead for better performance
    and index support (GiST) at high row counts — the Haversine approach
    here is a full-table-scan-with-bbox-prefilter, which is fine up to
    roughly hundreds of thousands of rows per city but not beyond that.
    """

    __tablename__ = "clients"
    __table_args__ = (Index("ix_clients_org_industry", "org_id", "industry_id"),)

    org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    industry_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("industries.id", ondelete="SET NULL"), nullable=True
    )

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    address: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    city: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    country: Mapped[str | None] = mapped_column(String(2), nullable=True, index=True)  # ISO alpha-2

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)

    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    website: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)

    # Provenance / freshness
    source: Mapped[str] = mapped_column(String(50), default="manual", nullable=False)  # google_places | csv_import | provider:<name> | manual
    source_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)  # e.g. Google place_id
    last_verified_at: Mapped["DateTime | None"] = mapped_column(DateTime(timezone=True), nullable=True)

    # Compliance
    consent_status: Mapped[str] = mapped_column(String(20), default=ConsentStatus.UNKNOWN.value, nullable=False)
    opt_out_at: Mapped["DateTime | None"] = mapped_column(DateTime(timezone=True), nullable=True)

    industry: Mapped["Industry | None"] = relationship()  # noqa: F821
    contacts: Mapped[list["Contact"]] = relationship(back_populates="client", cascade="all, delete-orphan")  # noqa: F821

