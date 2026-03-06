import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, SmallInteger, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base


class SkinMeasurement(Base):
    __tablename__ = "skin_measurements"

    measurement_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    measured_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())
    hydration_score: Mapped[float] = mapped_column(Float, nullable=False)
    elasticity_score: Mapped[float] = mapped_column(Float, nullable=False)
    pore_score: Mapped[float] = mapped_column(Float, nullable=False)
    wrinkle_score: Mapped[float] = mapped_column(Float, nullable=False)
    pigmentation_score: Mapped[float] = mapped_column(Float, nullable=False)
    overall_skin_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    classification_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    regression_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    capture_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="skin_measurements")
    daily_skin_score: Mapped["DailySkinScore | None"] = relationship(
        "DailySkinScore", back_populates="measurement", uselist=False
    )

    __table_args__ = (
        CheckConstraint(
            "hydration_score >= 0 AND hydration_score <= 100",
            name="chk_sm_hydration",
        ),
        CheckConstraint(
            "elasticity_score >= 0 AND elasticity_score <= 1",
            name="chk_sm_elasticity",
        ),
        CheckConstraint(
            "pore_score >= 0 AND pore_score <= 2600",
            name="chk_sm_pore",
        ),
        CheckConstraint(
            "wrinkle_score >= 0 AND wrinkle_score <= 50",
            name="chk_sm_wrinkle",
        ),
        CheckConstraint(
            "pigmentation_score >= 0 AND pigmentation_score <= 350",
            name="chk_sm_pigmentation",
        ),
        CheckConstraint(
            "overall_skin_score >= 0 AND overall_skin_score <= 100",
            name="chk_sm_overall",
        ),
        Index("idx_skin_measurements_user_date", "user_id", "measured_at"),
        Index("idx_skin_measurements_measured_at", "measured_at"),
        Index(
            "idx_skin_measurements_overall_score", "user_id", "overall_skin_score"
        ),
    )
