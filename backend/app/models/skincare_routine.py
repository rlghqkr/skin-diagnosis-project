import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base


class SkincareRoutine(Base):
    __tablename__ = "skincare_routines"

    routine_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    routine_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    time_of_day: Mapped[str] = mapped_column(String(10), nullable=False)
    steps: Mapped[list | None] = mapped_column(JSON, nullable=False, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_template: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    template_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    total_products: Mapped[int | None] = mapped_column(SmallInteger, default=0)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="skincare_routines")

    __table_args__ = (
        CheckConstraint(
            "time_of_day IN ('morning', 'night')",
            name="chk_routine_time_of_day",
        ),
        UniqueConstraint(
            "user_id", "routine_date", "time_of_day",
            name="uq_routine_user_date_time",
        ),
        Index("idx_routines_user_date", "user_id", "routine_date"),
        Index("idx_routines_template", "user_id", "is_template"),
    )
