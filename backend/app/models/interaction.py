import uuid
from enum import StrEnum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class InteractionType(StrEnum):
    CALL = "call"
    EMAIL = "email"
    SMS = "sms"
    CHAT_MESSAGE = "chat_message"
    NOTE = "note"


class Interaction(UUIDPKMixin, TimestampMixin, Base):
    """
    Unified activity-feed row for a client. Type-specific detail (call
    duration/recording, message body, etc.) lives in Call/Message; this
    table is what powers the "activity timeline" view and keeps a single
    place to query "everything that happened with this client".
    """

    __tablename__ = "interactions"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Foreign key to the type-specific row (call.id / message.id), nullable for plain notes
    related_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
