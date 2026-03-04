"""
NIA 피부 분석 API - Pydantic 스키마 정의

/predict, /recommend, /analyze 엔드포인트의 Request/Response 모델.
"""

from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class SkinType(str, Enum):
    DRY = "dry"
    OILY = "oily"
    COMBINATION = "combination"
    SENSITIVE = "sensitive"


class SkinConcern(str, Enum):
    WRINKLE = "wrinkle"
    PIGMENTATION = "pigmentation"
    PORE = "pore"
    SAGGING = "sagging"
    DRYNESS = "dryness"


# ---------------------------------------------------------------------------
# /predict 응답 스키마
# ---------------------------------------------------------------------------
class ClassificationResult(BaseModel):
    grade: int = Field(..., ge=0, le=6, description="분류 등급")
    probabilities: list[float] = Field(..., description="각 등급의 확률")


class RegressionResult(BaseModel):
    value: float = Field(..., description="회귀 예측값 (denormalized)")


class PredictResponse(BaseModel):
    mode: Literal["class", "regression"]
    predictions: dict[str, dict[str, ClassificationResult | RegressionResult]]
    warnings: list[str] | None = None


# ---------------------------------------------------------------------------
# /api/recommend 응답 스키마
# ---------------------------------------------------------------------------
class Ingredient(BaseModel):
    name_ko: str = Field(..., description="성분 한국어명")
    name_en: str | None = Field(None, description="성분 영어명")
    benefit: str = Field(..., description="해당 피부 고민에 대한 효능 설명")


class CosmeticProduct(BaseModel):
    id: str = Field(..., description="제품 고유 ID")
    name: str = Field(..., description="제품명")
    brand: str = Field(..., description="브랜드명")
    category: str = Field(..., description="제품 카테고리 (세럼, 크림 등)")
    image_url: str | None = Field(None, description="제품 이미지 URL")
    price: int | None = Field(None, description="가격 (원)")
    key_ingredients: list[str] = Field(default_factory=list, description="주요 성분 목록")
    match_score: float = Field(..., ge=0, le=100, description="피부 적합도 점수")
    match_reasons: list[str] = Field(default_factory=list, description="추천 이유")


class ConcernRecommendation(BaseModel):
    concern: SkinConcern
    severity: Literal["low", "moderate", "high"] = Field(..., description="심각도")
    recommended_ingredients: list[Ingredient] = Field(
        default_factory=list, description="추천 성분 목록"
    )
    products: list[CosmeticProduct] = Field(
        default_factory=list, description="추천 제품 목록"
    )


class RecommendResponse(BaseModel):
    skin_type: SkinType
    primary_concerns: list[SkinConcern] = Field(..., description="우선순위 피부 고민")
    recommendations: list[ConcernRecommendation] = Field(
        default_factory=list, description="고민별 추천"
    )


# ---------------------------------------------------------------------------
# /api/analyze 통합 응답 스키마
# ---------------------------------------------------------------------------
class CategoryScore(BaseModel):
    category: str = Field(..., description="카테고리명")
    score: float = Field(..., ge=0, le=100, description="카테고리 점수")
    label: str = Field(..., description="상태 라벨 (좋음/보통/나쁨 등)")


class SkinScore(BaseModel):
    overall: float = Field(..., ge=0, le=100, description="종합 피부 점수")
    categories: list[CategoryScore] = Field(..., description="카테고리별 점수")


class AnalyzeResponse(BaseModel):
    score: SkinScore = Field(..., description="피부 종합 점수")
    classification: dict[str, dict[str, ClassificationResult]] = Field(
        ..., description="분류 예측 결과"
    )
    regression: dict[str, dict[str, RegressionResult]] = Field(
        ..., description="회귀 예측 결과"
    )
    recommendation: RecommendResponse = Field(..., description="화장품 추천 결과")
    warnings: list[str] | None = None
