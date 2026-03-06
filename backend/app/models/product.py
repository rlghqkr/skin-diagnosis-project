import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Index,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    product_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    subcategory: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ingredients: Mapped[list | None] = mapped_column(JSON, default=list)
    key_ingredients: Mapped[list | None] = mapped_column(JSON, default=list)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    price: Mapped[float | None] = mapped_column(Numeric(10, 0), nullable=True)
    volume: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    platform: Mapped[str | None] = mapped_column(String(20), nullable=True)
    popularity_rank: Mapped[int | None] = mapped_column(nullable=True)
    skin_targets: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=func.now(), onupdate=func.now()
    )

    # Relationships
    usage_history: Mapped[list["ProductUsageHistory"]] = relationship(
        "ProductUsageHistory", back_populates="product"
    )
    effect_analyses: Mapped[list["ProductEffectAnalysis"]] = relationship(
        "ProductEffectAnalysis", back_populates="product"
    )

    __table_args__ = (
        CheckConstraint("price >= 0", name="chk_products_price"),
        Index("idx_products_brand_name", "brand", "product_name"),
        Index("idx_products_category", "category"),
        Index("idx_products_active", "is_active"),
        Index("idx_products_platform_rank", "platform", "popularity_rank"),
        Index("idx_products_platform_active", "platform", "is_active"),
    )
