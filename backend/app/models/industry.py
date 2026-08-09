import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class Industry(UUIDPKMixin, TimestampMixin, Base):
    """Hierarchical taxonomy, e.g. Retail > Restaurants > Fast Food."""

    __tablename__ = "industries"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("industries.id", ondelete="SET NULL"), nullable=True
    )

    parent: Mapped["Industry | None"] = relationship(remote_side="Industry.id")
