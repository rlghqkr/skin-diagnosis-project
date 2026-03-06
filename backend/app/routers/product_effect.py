"""
Product effect analysis & change detection API endpoints.

- GET  /api/v1/products/{id}/effect     - single product effect analysis
- GET  /api/v1/users/me/products/ranking - effect ranking
- POST /api/v1/products/compare          - multi-product comparison
- GET  /api/v1/detection/signals         - change detection signals
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.services.effect_analysis_service import (
    compare_products,
    compute_product_effect_score,
    get_product_ranking,
)
from app.services.detection_service import get_detection_signals

router = APIRouter(prefix="/api/v1", tags=["product-effect"])


# ── Request / Response schemas ───────────────────────────────────────────────

class CompareRequest(BaseModel):
    product_ids: list[str] = Field(..., min_length=2, max_length=10)


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/products/{product_id}/effect")
def analyze_product_effect(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compute (or recompute) the Product Effect Score for a single product."""
    result = compute_product_effect_score(db, current_user.user_id, product_id)
    if "error" in result:
        _raise_for_error(result)
    return result


@router.get("/users/me/products/ranking")
def product_ranking(
    min_confidence: float = Query(0.3, ge=0.0, le=1.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the user's products ranked by effect score (descending)."""
    return get_product_ranking(db, current_user.user_id, min_confidence)


@router.post("/products/compare")
def compare_product_effects(
    body: CompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Side-by-side comparison of effect analyses for multiple products."""
    return compare_products(db, current_user.user_id, body.product_ids)


@router.get("/detection/signals")
def detection_signals(
    target_date: date | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run all change-detection pipelines and return combined signals."""
    return get_detection_signals(db, current_user.user_id, target_date)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _raise_for_error(result: dict) -> None:
    error = result["error"]
    detail_map = {
        "user_not_found": ("사용자를 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND),
        "product_not_found": ("제품을 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND),
        "no_usage_history": ("해당 제품의 사용 이력이 없습니다.", status.HTTP_404_NOT_FOUND),
        "usage_too_short": (
            f"최소 {result.get('min_days', 14)}일 이상 사용해야 분석이 가능합니다. "
            f"현재 {result.get('usage_days', 0)}일 사용.",
            status.HTTP_422_UNPROCESSABLE_ENTITY,
        ),
        "insufficient_data_all_metrics": (
            "분석에 필요한 피부 측정 데이터가 부족합니다.",
            status.HTTP_422_UNPROCESSABLE_ENTITY,
        ),
    }
    detail, code = detail_map.get(error, (error, status.HTTP_400_BAD_REQUEST))
    raise HTTPException(status_code=code, detail=detail)
