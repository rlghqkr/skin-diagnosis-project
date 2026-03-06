import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    Float,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DailySkinScore(Base):
    __tablename__ = "daily_skin_scores"

    score_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    measurement_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("skin_measurements.measurement_id", ondelete="SET NULL"),
        nullable=True,
    )
    score_date: Mapped[date] = mapped_column(Date, nullable=False)
    overall_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    hydration_norm: Mapped[float | None] = mapped_column(Float, nullable=True)
    elasticity_norm: Mapped[float | None] = mapped_column(Float, nullable=True)
    pore_norm: Mapped[float | None] = mapped_column(Float, nullable=True)
    wrinkle_norm: Mapped[float | None] = mapped_column(Float, nullable=True)
    pigmentation_norm: Mapped[float | None] = mapped_column(Float, nullable=True)
    trend_direction: Mapped[str | None] = mapped_column(String(20), nullable=True)
    trend_velocity: Mapped[float | None] = mapped_column(Float, nullable=True)
    ma_7_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_anomaly: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="daily_skin_scores")
    measurement: Mapped["SkinMeasurement | None"] = relationship(
        "SkinMeasurement", back_populates="daily_skin_score"
    )

    __table_args__ = (
        CheckConstraint(
            "overall_score >= 0 AND overall_score <= 100",
            name="chk_daily_overall",
        ),
        CheckConstraint(
            "hydration_norm >= 0 AND hydration_norm <= 1",
            name="chk_daily_hydration",
        ),
        CheckConstraint(
            "elasticity_norm >= 0 AND elasticity_norm <= 1",
            name="chk_daily_elasticity",
        ),
        CheckConstraint(
            "pore_norm >= 0 AND pore_norm <= 1",
            name="chk_daily_pore",
        ),
        CheckConstraint(
            "wrinkle_norm >= 0 AND wrinkle_norm <= 1",
            name="chk_daily_wrinkle",
        ),
        CheckConstraint(
            "pigmentation_norm >= 0 AND pigmentation_norm <= 1",
            name="chk_daily_pigmentation",
        ),
        CheckConstraint(
            "trend_direction IN ('improving', 'stable', 'declining')",
            name="chk_daily_trend",
        ),
        UniqueConstraint("user_id", "score_date", name="uq_daily_score_user_date"),
        Index("idx_daily_scores_user_date", "user_id", "score_date"),
        Index("idx_daily_scores_trend", "user_id", "trend_direction"),
        Index("idx_daily_scores_anomaly", "user_id", "is_anomaly"),
    )
