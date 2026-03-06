"""
Product Effect Score (PES) algorithm implementation.

Faithfully follows the pseudocode in docs/04_product_effect_algorithm.md.
"""

from __future__ import annotations

from datetime import date, timedelta
from statistics import mean as py_mean
from typing import Any

import numpy as np
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.daily_skin_score import DailySkinScore
from app.models.product import Product
from app.models.product_effect import ProductEffectAnalysis
from app.models.product_usage import ProductUsageHistory
from app.models.skincare_routine import SkincareRoutine
from app.models.user import User
from app.services.statistics_service import (
    CONCERN_TO_METRIC,
    DEFAULT_METRIC_WEIGHTS,
    EPSILON,
    INGREDIENT_EFFECT_MAP,
    compute_ma,
    get_buffer_days,
    get_seasonal_factor,
    test_significance,
    trimmed_mean,
)


# ── Constants ────────────────────────────────────────────────────────────────
BASELINE_WINDOW_DAYS = 14
MIN_BASELINE_DAYS = 7
MIN_SAMPLES = 5
MIN_TOTAL_SAMPLES = 20
MIN_USAGE_DAYS = 28
CV_THRESHOLD = 0.15
BETA_CONCERN_BOOST = 0.3
GAMMA_TARGET_BOOST = 0.5
MIN_ISOLATION_DAYS = 14

ALL_METRICS = [
    "hydration_norm", "elasticity_norm", "pore_norm",
    "wrinkle_norm", "pigmentation_norm",
]


# ── Helper: query daily skin scores for a metric ────────────────────────────

def _query_metric_scores(
    db: Session,
    user_id: str,
    metric: str,
    date_from: date,
    date_to: date,
) -> tuple[list[float], list[date]]:
    """Return (values, dates) for a single metric column in the date range."""
    col = getattr(DailySkinScore, metric, None)
    if col is None:
        return [], []
    rows = (
        db.query(col, DailySkinScore.score_date)
        .filter(
            DailySkinScore.user_id == user_id,
            DailySkinScore.score_date >= date_from,
            DailySkinScore.score_date <= date_to,
            col.isnot(None),
        )
        .order_by(DailySkinScore.score_date)
        .all()
    )
    values = [float(r[0]) for r in rows]
    dates = [r[1] for r in rows]
    return values, dates


def _query_overall_scores(
    db: Session,
    user_id: str,
    date_from: date,
    date_to: date,
) -> tuple[list[float], list[date]]:
    rows = (
        db.query(DailySkinScore.overall_score, DailySkinScore.score_date)
        .filter(
            DailySkinScore.user_id == user_id,
            DailySkinScore.score_date >= date_from,
            DailySkinScore.score_date <= date_to,
        )
        .order_by(DailySkinScore.score_date)
        .all()
    )
    return [float(r[0]) for r in rows], [r[1] for r in rows]


# ── 1. Baseline estimation ──────────────────────────────────────────────────

def compute_baseline(
    db: Session,
    user_id: str,
    product_start: date,
    metric: str,
) -> dict[str, Any]:
    """Compute trimmed-mean baseline for *metric* in the 14-day window before product start."""
    bl_end = product_start - timedelta(days=1)
    bl_start = product_start - timedelta(days=BASELINE_WINDOW_DAYS)

    values, dates = _query_metric_scores(db, user_id, metric, bl_start, bl_end)

    if len(values) < MIN_SAMPLES:
        return {"status": "insufficient_data", "sample_count": len(values)}

    baseline_value = trimmed_mean(values, 0.1)
    std = float(np.std(values))
    mean_val = float(np.mean(values))
    cv = std / mean_val if mean_val != 0 else float("inf")

    return {
        "status": "ok",
        "value": baseline_value,
        "std": std,
        "cv": cv,
        "is_stable": cv < CV_THRESHOLD,
        "sample_count": len(values),
        "period_start": bl_start,
        "period_end": bl_end,
    }


# ── 2. Before/After comparison ──────────────────────────────────────────────

def compare_before_after(
    db: Session,
    user_id: str,
    usage: ProductUsageHistory,
    product: Product,
    metrics: list[str],
) -> dict[str, dict[str, Any]]:
    """Compare skin metrics before vs after product usage."""
    buffer_days = get_buffer_days(product.key_ingredients)

    before_start = usage.start_date - timedelta(days=BASELINE_WINDOW_DAYS)
    before_end = usage.start_date - timedelta(days=1)
    after_start = usage.start_date + timedelta(days=buffer_days)
    after_end = min(
        usage.end_date or date.today(),
        usage.start_date + timedelta(days=28 + buffer_days),
    )

    results: dict[str, dict[str, Any]] = {}
    for metric in metrics:
        before_vals, _ = _query_metric_scores(db, user_id, metric, before_start, before_end)
        after_vals, _ = _query_metric_scores(db, user_id, metric, after_start, after_end)

        if len(before_vals) < MIN_SAMPLES or len(after_vals) < MIN_SAMPLES:
            results[metric] = {"status": "insufficient_data"}
            continue

        before_avg = trimmed_mean(before_vals, 0.1)
        after_avg = trimmed_mean(after_vals, 0.1)
        raw_delta = after_avg - before_avg
        norm_delta = raw_delta / (before_avg + EPSILON)

        direction = (
            "improved" if raw_delta > 0
            else "declined" if raw_delta < 0
            else "unchanged"
        )

        results[metric] = {
            "status": "ok",
            "before_avg": before_avg,
            "after_avg": after_avg,
            "delta": raw_delta,
            "normalized_delta": norm_delta,
            "direction": direction,
            "before_count": len(before_vals),
            "after_count": len(after_vals),
            "before_values": before_vals,
            "after_values": after_vals,
        }
    return results


# ── 3. Personalized weights ─────────────────────────────────────────────────

def compute_personalized_weights(
    user: User,
    product: Product,
) -> dict[str, float]:
    """Adjust default metric weights based on user concerns & product targets."""
    user_concerns = set(user.skin_concerns or [])
    product_targets: set[str] = set()
    for ing in (product.key_ingredients or []):
        if isinstance(ing, dict):
            product_targets.update(ing.get("target_concerns", []))

    weights: dict[str, float] = {}
    for metric, default_w in DEFAULT_METRIC_WEIGHTS.items():
        w = default_w
        if any(CONCERN_TO_METRIC.get(c) == metric for c in user_concerns):
            w *= 1 + BETA_CONCERN_BOOST
        if any(CONCERN_TO_METRIC.get(c) == metric for c in product_targets):
            w *= 1 + GAMMA_TARGET_BOOST
        weights[metric] = w

    total = sum(weights.values())
    if total > 0:
        weights = {m: w / total for m, w in weights.items()}
    return weights


# ── 4. Routine stability (DiD prerequisite) ─────────────────────────────────

def check_routine_stability(
    db: Session,
    user_id: str,
    before_start: date,
    before_end: date,
    after_start: date,
    after_end: date,
    target_product_id: str,
) -> dict[str, Any]:
    """Check whether non-target products remained stable across periods."""
    def _active_product_ids(d_start: date, d_end: date) -> set[str]:
        rows = (
            db.query(ProductUsageHistory.product_id)
            .filter(
                ProductUsageHistory.user_id == user_id,
                ProductUsageHistory.start_date <= d_end,
                (ProductUsageHistory.end_date.is_(None))
                | (ProductUsageHistory.end_date >= d_start),
            )
            .all()
        )
        return {r[0] for r in rows}

    before_products = _active_product_ids(before_start, before_end)
    after_products = _active_product_ids(after_start, after_end) - {target_product_id}

    added = after_products - before_products
    removed = before_products - after_products

    is_stable = len(added) == 0 and len(removed) == 0
    stability_score = 1.0 if is_stable else max(0, 1 - 0.2 * (len(added) + len(removed)))

    return {
        "is_stable": is_stable,
        "added_products": list(added),
        "removed_products": list(removed),
        "stability_score": stability_score,
    }


# ── 5. Multi-product effect distribution ────────────────────────────────────

def distribute_effect_multi_product(
    db: Session,
    user_id: str,
    changed_metrics: dict[str, float],
    active_product_ids: list[str],
) -> dict[str, dict[str, dict[str, Any]]]:
    """Distribute observed metric changes across active products by ingredient relevance."""
    products = db.query(Product).filter(Product.product_id.in_(active_product_ids)).all()

    attributions: dict[str, dict[str, dict[str, Any]]] = {}
    for metric, delta in changed_metrics.items():
        metric_key = metric.replace("_norm", "")
        relevance_scores: dict[str, float] = {}

        for product in products:
            max_relevance = 0.0
            for ingredient in (product.key_ingredients or []):
                name_en = ingredient.get("name_en", "")
                rel = INGREDIENT_EFFECT_MAP.get(name_en, {}).get(metric_key, 0.0)
                max_relevance = max(max_relevance, rel)
            relevance_scores[product.product_id] = max_relevance

        total = sum(relevance_scores.values())
        if total == 0:
            for pid in relevance_scores:
                relevance_scores[pid] = 1.0 / len(relevance_scores)
        else:
            for pid in relevance_scores:
                relevance_scores[pid] /= total

        for pid, ratio in relevance_scores.items():
            attributions.setdefault(pid, {})[metric] = {
                "delta": delta * ratio,
                "attribution_ratio": ratio,
                "confidence": "estimated",
            }

    return attributions


# ── 6. Routine recording consistency ────────────────────────────────────────

def _get_routine_consistency(
    db: Session,
    user_id: str,
    start: date,
    end: date,
) -> float:
    """Fraction of days with at least one routine recorded."""
    total_days = (end - start).days
    if total_days <= 0:
        return 0.0
    recorded = (
        db.query(func.count(func.distinct(SkincareRoutine.routine_date)))
        .filter(
            SkincareRoutine.user_id == user_id,
            SkincareRoutine.routine_date >= start,
            SkincareRoutine.routine_date <= end,
            SkincareRoutine.is_template.is_(False),
        )
        .scalar()
    ) or 0
    return min(recorded / total_days, 1.0)


# ── 7. Main PES computation ─────────────────────────────────────────────────

def compute_product_effect_score(
    db: Session,
    user_id: str,
    product_id: str,
) -> dict[str, Any]:
    """
    End-to-end Product Effect Score (PES) computation.
    Returns result dict with effect_score, metric_deltas, confidence, interpretation.
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return {"error": "user_not_found"}

    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        return {"error": "product_not_found"}

    usage = (
        db.query(ProductUsageHistory)
        .filter(
            ProductUsageHistory.user_id == user_id,
            ProductUsageHistory.product_id == product_id,
        )
        .order_by(ProductUsageHistory.start_date.desc())
        .first()
    )
    if not usage:
        return {"error": "no_usage_history"}

    usage_days = ((usage.end_date or date.today()) - usage.start_date).days
    if usage_days < 14:
        return {"error": "usage_too_short", "usage_days": usage_days, "min_days": 14}

    # 1. Personalized weights
    weights = compute_personalized_weights(user, product)

    # 2. Per-metric comparison
    comparison = compare_before_after(db, user_id, usage, product, ALL_METRICS)

    baselines: dict[str, dict[str, Any]] = {}
    metric_deltas: dict[str, dict[str, Any]] = {}

    for metric in ALL_METRICS:
        bl = compute_baseline(db, user_id, usage.start_date, metric)
        baselines[metric] = bl
        comp = comparison.get(metric, {})

        if comp.get("status") != "ok" or bl.get("status") != "ok":
            continue

        month_mid = usage.start_date.month
        seasonal_adj = get_seasonal_factor(user.skin_type, metric, month_mid)

        raw_delta = comp["delta"]
        adj_delta = (raw_delta - seasonal_adj) / (bl["value"] + EPSILON)
        adj_delta = max(-1.0, min(1.0, adj_delta))

        metric_deltas[metric] = {
            "before_avg": comp["before_avg"],
            "after_avg": comp["after_avg"],
            "delta": raw_delta,
            "adj_delta": adj_delta,
            "seasonal_adjustment": seasonal_adj,
            "direction": comp["direction"],
        }

    if not metric_deltas:
        return {"error": "insufficient_data_all_metrics"}

    # 3. Confidence factors
    buffer_days = get_buffer_days(product.key_ingredients)
    before_start = usage.start_date - timedelta(days=BASELINE_WINDOW_DAYS)
    before_end = usage.start_date - timedelta(days=1)
    after_start = usage.start_date + timedelta(days=buffer_days)
    after_end = min(
        usage.end_date or date.today(),
        usage.start_date + timedelta(days=28 + buffer_days),
    )

    before_vals, _ = _query_overall_scores(db, user_id, before_start, before_end)
    after_vals, _ = _query_overall_scores(db, user_id, after_start, after_end)
    before_count = len(before_vals)
    after_count = len(after_vals)

    routine_consistency = _get_routine_consistency(
        db, user_id, usage.start_date, usage.end_date or date.today()
    )
    baseline_cvs = [
        bl["cv"] for bl in baselines.values()
        if bl.get("status") == "ok" and "cv" in bl
    ]
    max_cv = max(baseline_cvs) if baseline_cvs else 0.3

    c_sample = min((before_count + after_count) / MIN_TOTAL_SAMPLES, 1.0)
    c_duration = min(usage_days / MIN_USAGE_DAYS, 1.0)
    c_consistency = routine_consistency
    c_stability = 1 - min(max_cv / 0.3, 1.0)
    c_total = c_sample * c_duration * max(c_consistency, 0.1) * max(c_stability, 0.1)

    # 4. Multi-product separation strategy
    stability = check_routine_stability(
        db, user_id, before_start, before_end, after_start, after_end, product_id,
    )

    if stability["is_stable"]:
        method = "difference_in_differences"
        confidence_modifier = 1.0
    else:
        method = "ingredient_attribution"
        confidence_modifier = max(stability["stability_score"], 0.4)

    c_total *= confidence_modifier

    # 5. Statistical significance
    before_scores_map: dict[str, list[float]] = {}
    after_scores_map: dict[str, list[float]] = {}
    for metric in metric_deltas:
        comp = comparison[metric]
        before_scores_map[metric] = comp.get("before_values", [])
        after_scores_map[metric] = comp.get("after_values", [])
    sig_results = test_significance(
        before_scores_map, after_scores_map, list(metric_deltas.keys())
    )
    sig_map = {r["metric"]: r for r in sig_results}

    # 6. PES
    weighted_sum = 0.0
    for m, d in metric_deltas.items():
        weight_key = m.replace("_norm", "")
        w = weights.get(weight_key, 0.0)
        weighted_sum += w * d["adj_delta"]
        d["significance"] = sig_map.get(m, {})

    pes = weighted_sum * c_total * 100
    pes = max(-100, min(100, pes))

    interpretation = _interpret_score(pes, c_total)

    # 7. Save analysis
    before_avgs = [d["before_avg"] for d in metric_deltas.values()]
    after_avgs = [d["after_avg"] for d in metric_deltas.values()]

    # Strip raw score lists before saving to JSON
    deltas_for_db = {}
    for m, d in metric_deltas.items():
        deltas_for_db[m] = {k: v for k, v in d.items() if k != "significance"}

    analysis = ProductEffectAnalysis(
        user_id=user_id,
        product_id=product_id,
        analysis_period_start=before_start,
        analysis_period_end=after_end,
        effect_score=round(pes, 2),
        metric_deltas=deltas_for_db,
        confidence_level=round(c_total, 4),
        usage_duration_days=usage_days,
        before_avg_score=round(py_mean(before_avgs), 4) if before_avgs else None,
        after_avg_score=round(py_mean(after_avgs), 4) if after_avgs else None,
        sample_count=before_count + after_count,
        analysis_version="1.0",
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "analysis_id": analysis.analysis_id,
        "effect_score": round(pes, 2),
        "metric_deltas": metric_deltas,
        "confidence": round(c_total, 4),
        "method": method,
        "interpretation": interpretation,
        "usage_days": usage_days,
        "sample_count": before_count + after_count,
        "significance": sig_results,
    }


# ── 8. Score interpretation ──────────────────────────────────────────────────

def _interpret_score(pes: float, confidence: float) -> dict[str, str]:
    """Map PES + confidence to human-readable interpretation."""
    if pes >= 30:
        label = "significant_improvement"
        message = "이 제품이 피부 개선에 도움이 되고 있어요!"
    elif pes >= 10:
        label = "mild_improvement"
        message = "약간의 개선 효과가 관찰됩니다"
    elif pes >= -10:
        label = "no_change"
        message = "뚜렷한 변화가 감지되지 않았어요"
    elif pes >= -30:
        label = "mild_deterioration"
        message = "피부 상태가 약간 나빠진 것 같아요"
    else:
        label = "significant_deterioration"
        message = "이 제품이 피부에 맞지 않을 수 있어요"

    if confidence < 0.3:
        caveat = "더 많은 측정 데이터가 필요합니다"
    elif confidence < 0.5:
        caveat = "아직 데이터가 충분하지 않아 참고용으로만 활용해주세요"
    else:
        caveat = None

    result = {"label": label, "message": message}
    if caveat:
        result["caveat"] = caveat
    return result


# ── 9. Product ranking ──────────────────────────────────────────────────────

def get_product_ranking(
    db: Session,
    user_id: str,
    min_confidence: float = 0.3,
) -> list[dict[str, Any]]:
    """Return user's products ranked by latest effect score (desc)."""
    # Subquery: latest analysis per product
    subq = (
        db.query(
            ProductEffectAnalysis.product_id,
            func.max(ProductEffectAnalysis.created_at).label("latest"),
        )
        .filter(
            ProductEffectAnalysis.user_id == user_id,
            ProductEffectAnalysis.confidence_level >= min_confidence,
        )
        .group_by(ProductEffectAnalysis.product_id)
        .subquery()
    )

    rows = (
        db.query(ProductEffectAnalysis, Product)
        .join(
            subq,
            and_(
                ProductEffectAnalysis.product_id == subq.c.product_id,
                ProductEffectAnalysis.created_at == subq.c.latest,
            ),
        )
        .join(Product, Product.product_id == ProductEffectAnalysis.product_id)
        .filter(ProductEffectAnalysis.user_id == user_id)
        .order_by(ProductEffectAnalysis.effect_score.desc())
        .all()
    )

    ranking: list[dict[str, Any]] = []
    for analysis, product in rows:
        ranking.append({
            "product_id": product.product_id,
            "product_name": product.product_name,
            "brand": product.brand,
            "category": product.category,
            "effect_score": analysis.effect_score,
            "confidence_level": analysis.confidence_level,
            "usage_duration_days": analysis.usage_duration_days,
            "interpretation": _interpret_score(
                analysis.effect_score, analysis.confidence_level
            ),
        })
    return ranking


# ── 10. Product comparison ───────────────────────────────────────────────────

def compare_products(
    db: Session,
    user_id: str,
    product_ids: list[str],
) -> dict[str, Any]:
    """Compare effect analyses for multiple products side-by-side."""
    results: list[dict[str, Any]] = []
    for pid in product_ids:
        analysis = (
            db.query(ProductEffectAnalysis)
            .filter(
                ProductEffectAnalysis.user_id == user_id,
                ProductEffectAnalysis.product_id == pid,
            )
            .order_by(ProductEffectAnalysis.created_at.desc())
            .first()
        )
        product = db.query(Product).filter(Product.product_id == pid).first()
        if analysis and product:
            results.append({
                "product_id": pid,
                "product_name": product.product_name,
                "brand": product.brand,
                "effect_score": analysis.effect_score,
                "confidence_level": analysis.confidence_level,
                "metric_deltas": analysis.metric_deltas,
                "usage_duration_days": analysis.usage_duration_days,
            })
        else:
            results.append({
                "product_id": pid,
                "product_name": product.product_name if product else None,
                "error": "no_analysis",
            })

    return {"products": results}
