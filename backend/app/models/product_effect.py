import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base


class ProductEffectAnalysis(Base):
    __tablename__ = "product_effect_analyses"

    analysis_id: Mapped[str] = mapped_column(
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
    analysis_period_start: Mapped[date] = mapped_column(Date, nullable=False)
    analysis_period_end: Mapped[date] = mapped_column(Date, nullable=False)
    effect_score: Mapped[float] = mapped_column(Float, nullable=False)
    metric_deltas: Mapped[dict] = mapped_column(JSON, nullable=False)
    confidence_level: Mapped[float] = mapped_column(Float, nullable=False)
    usage_duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    before_avg_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    after_avg_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    sample_count: Mapped[int] = mapped_column(Integer, nullable=False)
    analysis_version: Mapped[str] = mapped_column(
        String(10), nullable=False, default="1.0"
    )
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())

    # Relationships
    user: Mapped["User"] = relationship(
        "User", back_populates="product_effect_analyses"
    )
    product: Mapped["Product"] = relationship(
        "Product", back_populates="effect_analyses"
    )

    __table_args__ = (
        CheckConstraint(
            "effect_score >= -100 AND effect_score <= 100",
            name="chk_effect_score",
        ),
        CheckConstraint(
            "confidence_level >= 0 AND confidence_level <= 1",
            name="chk_effect_confidence",
        ),
        CheckConstraint(
            "analysis_period_end >= analysis_period_start",
            name="chk_analysis_period",
        ),
        Index("idx_effect_user_product", "user_id", "product_id"),
        Index("idx_effect_user_date", "user_id", "created_at"),
        Index("idx_effect_user_score", "user_id", "effect_score"),
        Index("idx_effect_product", "product_id", "effect_score"),
    )
