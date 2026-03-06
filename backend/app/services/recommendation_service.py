"""Platform-based product recommendation service.

6-step algorithm:
1. Find worst metric from category scores
2. Map Korean category → English metric
3. Reverse INGREDIENT_EFFECT_MAP → ingredients per metric
4. Query DB for top platform products with skin_targets filter
5. Score: ingredient match (70%) + popularity (30%)
6. Pick top-1 per platform + generate Korean reason
"""

from __future__ import annotations

import hashlib
import json

from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.product_recommendation import ProductRecommendation
from app.services.statistics_service import INGREDIENT_EFFECT_MAP

# Korean category name → English metric
CATEGORY_TO_METRIC: dict[str, str] = {
    "수분": "hydration",
    "탄력": "elasticity",
    "모공": "pore",
    "주름": "wrinkle",
    "색소": "pigmentation",
    "건조": "hydration",
    "탄성": "elasticity",
}

# English metric → Korean display label
METRIC_TO_LABEL: dict[str, str] = {
    "hydration": "수분",
    "elasticity": "탄력",
    "pore": "모공",
    "wrinkle": "주름",
    "pigmentation": "색소",
}

PLATFORM_LABELS: dict[str, str] = {
    "oliveyoung": "올리브영",
    "hwahae": "화해",
    "daiso": "다이소",
    "internal": "Our AI",
}

PLATFORMS = ["oliveyoung", "hwahae", "daiso", "internal"]


def _build_metric_ingredients() -> dict[str, list[tuple[str, float]]]:
    """Reverse INGREDIENT_EFFECT_MAP: metric → [(ingredient, weight)]."""
    result: dict[str, list[tuple[str, float]]] = {}
    for ingredient, effects in INGREDIENT_EFFECT_MAP.items():
        for metric, weight in effects.items():
            result.setdefault(metric, []).append((ingredient, weight))
    for v in result.values():
        v.sort(key=lambda x: x[1], reverse=True)
    return result


METRIC_INGREDIENTS = _build_metric_ingredients()


def _find_worst_metric(
    categories: list[dict],
) -> tuple[str, str, float]:
    """Return (english_metric, korean_label, score) for worst category."""
    worst_score = float("inf")
    worst_metric = "hydration"
    worst_label = "수분"

    for cat in categories:
        category_name = cat["category"]
        score = cat["score"]
        metric = CATEGORY_TO_METRIC.get(category_name)
        if metric and score < worst_score:
            worst_score = score
            worst_metric = metric
            worst_label = category_name

    return worst_metric, worst_label, worst_score


def _compute_analysis_hash(categories: list[dict]) -> str:
    """Deterministic hash from category scores for cache key."""
    normalized = sorted(categories, key=lambda c: c["category"])
    payload = json.dumps(normalized, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


def _score_product(
    product: Product,
    target_ingredients: list[tuple[str, float]],
) -> float:
    """Score a product: 70% ingredient match + 30% popularity."""
    # Ingredient match score
    product_ingredients = set(product.key_ingredients or [])
    target_names = {name for name, _ in target_ingredients}
    if target_names:
        matched = product_ingredients & target_names
        # Weighted match
        total_weight = sum(w for _, w in target_ingredients)
        matched_weight = sum(
            w for name, w in target_ingredients if name in matched
        )
        ingredient_score = matched_weight / total_weight if total_weight else 0
    else:
        ingredient_score = 0

    # Popularity score (rank 1 = best)
    rank = product.popularity_rank or 30
    popularity_score = max(0, (31 - rank) / 30)

    return ingredient_score * 0.7 + popularity_score * 0.3


def _generate_reason(
    product: Product,
    metric: str,
    target_ingredients: list[tuple[str, float]],
) -> str:
    """Generate a Korean recommendation reason."""
    product_ingredients = set(product.key_ingredients or [])
    matched = [
        name for name, _ in target_ingredients if name in product_ingredients
    ]
    metric_label = METRIC_TO_LABEL.get(metric, metric)

    if matched:
        ingredients_str = ", ".join(matched[:2])
        return f"{ingredients_str} 성분이 {metric_label} 개선에 도움을 줍니다"
    return f"{metric_label} 케어에 적합한 제품입니다"


def get_platform_recommendations(
    db: Session,
    categories: list[dict],
    user_id: str | None = None,
) -> dict:
    """Main entry: return platform recommendations for given category scores."""
    worst_metric, worst_label, worst_score = _find_worst_metric(categories)
    analysis_hash = _compute_analysis_hash(categories)

    # Check cache for authenticated users
    if user_id:
        cached = (
            db.query(ProductRecommendation)
            .filter(
                ProductRecommendation.user_id == user_id,
                ProductRecommendation.source_analysis_hash == analysis_hash,
            )
            .first()
        )
        if cached:
            return {
                "worst_metric": cached.worst_metric,
                "worst_metric_label": METRIC_TO_LABEL.get(
                    cached.worst_metric, worst_label
                ),
                "worst_score": worst_score,
                "products": cached.recommended_products or [],
            }

    # Get target ingredients for worst metric
    target_ingredients = METRIC_INGREDIENTS.get(worst_metric, [])

    products_result = []
    for platform in PLATFORMS:
        # Query active products for this platform, ordered by popularity
        candidates = (
            db.query(Product)
            .filter(
                Product.platform == platform,
                Product.is_active == True,
            )
            .order_by(Product.popularity_rank.asc().nullslast())
            .limit(30)
            .all()
        )

        # Filter by skin_targets if available
        filtered = [
            p for p in candidates
            if not p.skin_targets or worst_metric in (p.skin_targets or [])
        ]
        if not filtered:
            filtered = candidates

        if not filtered:
            continue

        # Score and pick best
        scored = [
            (p, _score_product(p, target_ingredients)) for p in filtered
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        best_product, best_score = scored[0]

        products_result.append({
            "platform": platform,
            "platform_label": PLATFORM_LABELS.get(platform, platform),
            "product_name": best_product.product_name,
            "brand": best_product.brand,
            "image_url": best_product.image_url,
            "price": float(best_product.price) if best_product.price else None,
            "reason": _generate_reason(
                best_product, worst_metric, target_ingredients
            ),
            "match_score": round(best_score, 2),
        })

    result = {
        "worst_metric": worst_metric,
        "worst_metric_label": worst_label,
        "worst_score": worst_score,
        "products": products_result,
    }

    # Cache for authenticated users
    if user_id and products_result:
        rec = ProductRecommendation(
            user_id=user_id,
            source_analysis_hash=analysis_hash,
            worst_metric=worst_metric,
            recommended_products=products_result,
        )
        db.add(rec)
        db.commit()

    return result
