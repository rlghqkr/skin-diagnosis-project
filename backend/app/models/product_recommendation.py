import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.database import Base


class ProductRecommendation(Base):
    __tablename__ = "product_recommendations"

    recommendation_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.user_id"), nullable=False
    )
    source_analysis_hash: Mapped[str] = mapped_column(
        String(64), nullable=False
    )
    worst_metric: Mapped[str] = mapped_column(String(30), nullable=False)
    recommended_products: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())

    __table_args__ = (
        Index("idx_rec_user_hash", "user_id", "source_analysis_hash"),
    )
