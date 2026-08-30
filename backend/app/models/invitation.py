import datetime
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class Invitation(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "invitations"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    token: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    is_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    organization: Mapped["Organization"] = relationship()
