import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Index, String, SmallInteger, Boolean, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    nickname: Mapped[str] = mapped_column(String(50), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    age: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(10), nullable=True)
    skin_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    skin_concerns: Mapped[dict | None] = mapped_column(JSON, default=list)
    baseline_skin_score: Mapped[int | None] = mapped_column(
        SmallInteger, nullable=True
    )
    profile_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notification_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=func.now(), onupdate=func.now()
    )

    # Relationships
    skin_measurements: Mapped[list["SkinMeasurement"]] = relationship(
        "SkinMeasurement", back_populates="user", cascade="all, delete-orphan"
    )
    skincare_routines: Mapped[list["SkincareRoutine"]] = relationship(
        "SkincareRoutine", back_populates="user", cascade="all, delete-orphan"
    )
    product_usage_history: Mapped[list["ProductUsageHistory"]] = relationship(
        "ProductUsageHistory", back_populates="user", cascade="all, delete-orphan"
    )
    daily_skin_scores: Mapped[list["DailySkinScore"]] = relationship(
        "DailySkinScore", back_populates="user", cascade="all, delete-orphan"
    )
    product_effect_analyses: Mapped[list["ProductEffectAnalysis"]] = relationship(
        "ProductEffectAnalysis", back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("age >= 10 AND age <= 120", name="chk_users_age"),
        CheckConstraint(
            "gender IN ('male', 'female', 'other')", name="chk_users_gender"
        ),
        CheckConstraint(
            "skin_type IN ('dry', 'oily', 'combination', 'sensitive', 'normal')",
            name="chk_users_skin_type",
        ),
        CheckConstraint(
            "baseline_skin_score >= 0 AND baseline_skin_score <= 100",
            name="chk_users_baseline_score",
        ),
        Index("idx_users_email", "email"),
        Index("idx_users_skin_type", "skin_type"),
    )
