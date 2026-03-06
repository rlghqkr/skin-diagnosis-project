from pydantic import BaseModel, Field


class CategoryScoreInput(BaseModel):
    category: str
    score: float = Field(ge=0, le=100)
    label: str


class RecommendedProduct(BaseModel):
    platform: str
    platform_label: str
    product_name: str
    brand: str
    image_url: str | None = None
    price: float | None = None
    reason: str
    match_score: float


class PlatformRecommendationResponse(BaseModel):
    worst_metric: str
    worst_metric_label: str
    worst_score: float
    products: list[RecommendedProduct]
