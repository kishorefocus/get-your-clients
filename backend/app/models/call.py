import uuid
from enum import StrEnum

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class CallOutcome(StrEnum):
    NO_ANSWER = "no_answer"
    VOICEMAIL = "voicemail"
    CONNECTED = "connected"
    NOT_INTERESTED = "not_interested"
    FOLLOW_UP_SCHEDULED = "follow_up_scheduled"


class Call(UUIDPKMixin, TimestampMixin, Base):
    """
    Populated by the calling module (build-order step 7). The schema is
    defined now so Interaction rows can reference it, but the Twilio
    integration that creates/updates these rows is not wired up in this
    scaffold — see README "What's stubbed".
    """

    __tablename__ = "calls"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    provider_call_sid: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recording_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    outcome: Mapped[str | None] = mapped_column(String(30), nullable=True)
