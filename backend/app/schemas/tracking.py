from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class DailySkinScoreCreate(BaseModel):
    user_id: str
    measurement_id: str | None = None
    score_date: date
    overall_score: int = Field(..., ge=0, le=100)
    hydration_norm: float | None = Field(None, ge=0, le=1)
    elasticity_norm: float | None = Field(None, ge=0, le=1)
    pore_norm: float | None = Field(None, ge=0, le=1)
    wrinkle_norm: float | None = Field(None, ge=0, le=1)
    pigmentation_norm: float | None = Field(None, ge=0, le=1)
    trend_direction: Literal["improving", "stable", "declining"] | None = None
    trend_velocity: float | None = None
    ma_7_score: float | None = None
    is_anomaly: bool = False


class DailySkinScoreRead(BaseModel):
    score_id: str
    user_id: str
    measurement_id: str | None = None
    score_date: date
    overall_score: int
    hydration_norm: float | None = None
    elasticity_norm: float | None = None
    pore_norm: float | None = None
    wrinkle_norm: float | None = None
    pigmentation_norm: float | None = None
    trend_direction: str | None = None
    trend_velocity: float | None = None
    ma_7_score: float | None = None
    is_anomaly: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductEffectAnalysisCreate(BaseModel):
    user_id: str
    product_id: str
    analysis_period_start: date
    analysis_period_end: date
    effect_score: float = Field(..., ge=-100, le=100)
    metric_deltas: dict
    confidence_level: float = Field(..., ge=0, le=1)
    usage_duration_days: int
    before_avg_score: float | None = None
    after_avg_score: float | None = None
    sample_count: int
    analysis_version: str = "1.0"


class ProductEffectAnalysisRead(BaseModel):
    analysis_id: str
    user_id: str
    product_id: str
    analysis_period_start: date
    analysis_period_end: date
    effect_score: float
    metric_deltas: dict
    confidence_level: float
    usage_duration_days: int
    before_avg_score: float | None = None
    after_avg_score: float | None = None
    sample_count: int
    analysis_version: str
    created_at: datetime

    model_config = {"from_attributes": True}
