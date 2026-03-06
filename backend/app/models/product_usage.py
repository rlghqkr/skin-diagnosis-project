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
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProductUsageHistory(Base):
    __tablename__ = "product_usage_history"

    usage_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("products.product_id", ondelete="RESTRICT"),
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    frequency: Mapped[str | None] = mapped_column(
        String(20), default="daily"
    )
    time_of_day: Mapped[str | None] = mapped_column(
        String(10), default="both"
    )
    satisfaction_rating: Mapped[int | None] = mapped_column(
        SmallInteger, nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="product_usage_history")
    product: Mapped["Product"] = relationship(
        "Product", back_populates="usage_history"
    )

    __table_args__ = (
        CheckConstraint(
            "frequency IN ('daily', 'weekly', 'occasional')",
            name="chk_usage_frequency",
        ),
        CheckConstraint(
            "time_of_day IN ('morning', 'night', 'both')",
            name="chk_usage_time_of_day",
        ),
        CheckConstraint(
            "satisfaction_rating >= 1 AND satisfaction_rating <= 5",
            name="chk_usage_satisfaction",
        ),
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="chk_date_range",
        ),
        Index("idx_usage_user_active", "user_id", "is_active"),
        Index("idx_usage_user_product", "user_id", "product_id"),
        Index("idx_usage_date_range", "user_id", "start_date", "end_date"),
        Index("idx_usage_product", "product_id", "is_active"),
    )
