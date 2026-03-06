"""
Skin change detection logic.

Implements docs/05_skin_change_detection.md:
- Improvement detection  (Threshold -> Statistical -> Context)
- Deterioration detection (Watch L1 -> Warning L2 -> Alert L3)
- Product impact probability
- Alert throttling
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

import numpy as np
from scipy import stats as sp_stats
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.daily_skin_score import DailySkinScore
from app.models.product import Product
from app.models.product_effect import ProductEffectAnalysis
from app.models.product_usage import ProductUsageHistory
from app.models.user import User
from app.services.statistics_service import (
    EXPECTED_EFFECT_LAG,
    INGREDIENT_EFFECT_MAP,
    METRIC_LABELS,
    cohens_d,
    compute_ma,
    welch_ttest,
)

ALL_METRICS = [
    "hydration_norm", "elasticity_norm", "pore_norm",
    "wrinkle_norm", "pigmentation_norm",
]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _query_scores(
    db: Session,
    user_id: str,
    date_from: date,
    date_to: date,
) -> tuple[list[float], list[date]]:
    """Query overall_score values in a date range."""
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


def _query_metric(
    db: Session,
    user_id: str,
    metric: str,
    date_from: date,
    date_to: date,
) -> list[float]:
    col = getattr(DailySkinScore, metric, None)
    if col is None:
        return []
    rows = (
        db.query(col)
        .filter(
            DailySkinScore.user_id == user_id,
            DailySkinScore.score_date >= date_from,
            DailySkinScore.score_date <= date_to,
            col.isnot(None),
        )
        .order_by(DailySkinScore.score_date)
        .all()
    )
    return [float(r[0]) for r in rows]


# ── 1. Improvement detection ────────────────────────────────────────────────

def _threshold_screen_improvement(
    scores: list[float],
    dates: list[date],
    current_date: date,
) -> dict[str, Any] | None:
    """Stage 1: fast threshold screening."""
    if len(scores) < 7:
        return None

    ma7_current = compute_ma(scores, dates, current_date, window=7)
    ma7_prev = compute_ma(scores, dates, current_date - timedelta(days=7), window=7)

    if ma7_current is None or ma7_prev is None:
        return None

    abs_change = ma7_current - ma7_prev
    if abs_change > 3.0:
        return {"type": "absolute", "delta": abs_change}

    rel_change = abs_change / (ma7_prev + 0.01)
    if rel_change > 0.05:
        return {"type": "relative", "delta": rel_change}

    # Consecutive improvement (5 days)
    recent = scores[-5:] if len(scores) >= 5 else []
    if len(recent) == 5 and all(recent[i] > recent[i + 1] for i in range(len(recent) - 1)):
        return {"type": "consecutive", "streak": 5}

    return None


def _statistical_confirm(
    recent_scores: list[float],
    previous_scores: list[float],
) -> dict[str, Any]:
    """Stage 2: statistical confirmation via one-sided Welch t-test."""
    if len(recent_scores) < 5 or len(previous_scores) < 5:
        return {"confirmed": False, "reason": "insufficient_samples"}

    tt = welch_ttest(recent_scores, previous_scores, one_sided=True)
    d = cohens_d(recent_scores, previous_scores)

    is_significant = tt["p_value"] < 0.05 and tt["t_stat"] > 0
    is_meaningful = abs(d) >= 0.3

    return {
        "confirmed": is_significant and is_meaningful,
        "p_value": tt["p_value"],
        "cohens_d": d,
        "mean_recent": float(np.mean(recent_scores)),
        "mean_previous": float(np.mean(previous_scores)),
    }


def _contextual_analysis(
    db: Session,
    user_id: str,
    current_date: date,
) -> list[dict[str, Any]]:
    """Stage 3: identify which individual metrics improved."""
    improved: list[dict[str, Any]] = []
    for metric in ALL_METRICS:
        recent = _query_metric(
            db, user_id, metric,
            current_date - timedelta(days=14), current_date,
        )
        previous = _query_metric(
            db, user_id, metric,
            current_date - timedelta(days=28), current_date - timedelta(days=14),
        )
        if len(recent) < 5 or len(previous) < 5:
            continue

        delta = float(np.mean(recent) - np.mean(previous))
        tt = welch_ttest(recent, previous, one_sided=True)
        if tt["p_value"] < 0.05 and delta > 0:
            improved.append({
                "metric": metric,
                "delta": delta,
                "p_value": tt["p_value"],
                "label": METRIC_LABELS.get(metric, metric),
            })

    improved.sort(key=lambda x: x["delta"], reverse=True)
    return improved


def detect_improvement(
    db: Session,
    user_id: str,
    current_date: date | None = None,
) -> dict[str, Any]:
    """Full 3-stage improvement detection pipeline."""
    current_date = current_date or date.today()

    scores, dates = _query_scores(
        db, user_id, current_date - timedelta(days=28), current_date,
    )

    # Stage 1
    candidate = _threshold_screen_improvement(scores, dates, current_date)
    if not candidate:
        return {"detected": False}

    # Stage 2
    recent, _ = _query_scores(
        db, user_id, current_date - timedelta(days=14), current_date,
    )
    previous, _ = _query_scores(
        db, user_id, current_date - timedelta(days=28),
        current_date - timedelta(days=14),
    )
    stat = _statistical_confirm(recent, previous)
    if not stat["confirmed"]:
        return {"detected": False, "stage": "statistical_rejected", **stat}

    # Stage 3
    improved_metrics = _contextual_analysis(db, user_id, current_date)

    return {
        "detected": True,
        "threshold": candidate,
        "statistical": stat,
        "improved_metrics": improved_metrics,
    }


# ── 2. Deterioration detection ──────────────────────────────────────────────

def _detect_watch(
    scores: list[float],
    dates: list[date],
    current_date: date,
) -> dict[str, Any]:
    """Level 1: short-term decline over 3 days."""
    ma3_current = compute_ma(scores, dates, current_date, window=3, min_points=2)
    ma3_prev = compute_ma(scores, dates, current_date - timedelta(days=3), window=3, min_points=2)
    if ma3_current is None or ma3_prev is None:
        return {"level": 0}

    decline = ma3_prev - ma3_current
    if decline > 2.0:
        return {
            "level": 1,
            "decline_amount": decline,
            "period_days": 3,
            "message": "피부 상태가 최근 며칠간 약간 나빠진 것 같아요. 주의 깊게 관찰해볼까요?",
        }
    return {"level": 0}


def _detect_warning(
    scores: list[float],
    dates: list[date],
    current_date: date,
    db: Session,
    user_id: str,
) -> dict[str, Any]:
    """Level 2: sustained decline over 7 days."""
    ma7_current = compute_ma(scores, dates, current_date, window=7)
    ma7_prev = compute_ma(scores, dates, current_date - timedelta(days=7), window=7)
    if ma7_current is None or ma7_prev is None:
        return {"level": 0}

    decline = ma7_prev - ma7_current

    # Count consecutive declining trend
    trend_rows = (
        db.query(DailySkinScore.trend_direction)
        .filter(
            DailySkinScore.user_id == user_id,
            DailySkinScore.score_date >= current_date - timedelta(days=7),
            DailySkinScore.score_date <= current_date,
        )
        .order_by(DailySkinScore.score_date.desc())
        .all()
    )
    consecutive = 0
    for (td,) in trend_rows:
        if td == "declining":
            consecutive += 1
        else:
            break

    if decline > 3.0 and consecutive >= 3:
        return {
            "level": 2,
            "decline_amount": decline,
            "consecutive_declining_days": consecutive,
            "message": "피부 상태가 지난주보다 나빠지고 있어요. 최근 변경한 제품이나 습관이 있나요?",
        }
    return {"level": 0}


def _detect_alert(
    db: Session,
    user_id: str,
    current_date: date,
) -> dict[str, Any]:
    """Level 3: statistically significant deterioration."""
    recent, _ = _query_scores(
        db, user_id, current_date - timedelta(days=14), current_date,
    )
    previous, _ = _query_scores(
        db, user_id, current_date - timedelta(days=28),
        current_date - timedelta(days=14),
    )

    if len(recent) < 7 or len(previous) < 7:
        return {"level": 0}

    tt = welch_ttest(recent, previous)
    d = cohens_d(recent, previous)

    is_deteriorating = tt["p_value"] < 0.05 and tt["t_stat"] < 0
    if not is_deteriorating or abs(d) < 0.5:
        return {"level": 0}

    deteriorated = _identify_deteriorated_metrics(db, user_id, current_date)

    return {
        "level": 3,
        "p_value": tt["p_value"],
        "cohens_d": d,
        "deteriorated_metrics": deteriorated,
        "message": "피부 상태가 크게 나빠졌어요. 루틴을 점검하고, 최근 변경 사항을 확인해보세요.",
    }


def _identify_deteriorated_metrics(
    db: Session,
    user_id: str,
    current_date: date,
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for metric in ALL_METRICS:
        recent = _query_metric(
            db, user_id, metric,
            current_date - timedelta(days=7), current_date,
        )
        previous = _query_metric(
            db, user_id, metric,
            current_date - timedelta(days=14), current_date - timedelta(days=7),
        )
        if len(recent) < 3 or len(previous) < 3:
            continue
        decline = float(np.mean(previous) - np.mean(recent))
        rel_decline = decline / (float(np.mean(previous)) + 0.01)
        if rel_decline > 0.10:
            result.append({
                "metric": metric,
                "decline": decline,
                "relative_decline": rel_decline,
                "label": METRIC_LABELS.get(metric, metric),
            })
    return result


def detect_deterioration(
    db: Session,
    user_id: str,
    current_date: date | None = None,
) -> dict[str, Any]:
    """Full deterioration pipeline: L3 -> L2 -> L1."""
    current_date = current_date or date.today()

    # L3
    alert = _detect_alert(db, user_id, current_date)
    if alert["level"] == 3:
        return {
            "level": 3,
            "alert": alert,
            "action": "routine_review_suggested",
            "urgency": "high",
        }

    scores, dates = _query_scores(
        db, user_id, current_date - timedelta(days=21), current_date,
    )

    # L2
    warning = _detect_warning(scores, dates, current_date, db, user_id)
    if warning["level"] == 2:
        return {
            "level": 2,
            "warning": warning,
            "action": "monitoring_enhanced",
            "urgency": "medium",
        }

    # L1
    watch = _detect_watch(scores, dates, current_date)
    if watch["level"] == 1:
        return {
            "level": 1,
            "watch": watch,
            "action": "observation",
            "urgency": "low",
        }

    return {"level": 0, "action": "none"}


# ── 3. Product impact probability ───────────────────────────────────────────

def _detect_product_changes(
    db: Session,
    user_id: str,
    lookback_days: int = 28,
) -> list[dict[str, Any]]:
    """Identify products added or removed in the last N days."""
    cutoff = date.today() - timedelta(days=lookback_days)
    changes: list[dict[str, Any]] = []

    added = (
        db.query(ProductUsageHistory)
        .filter(
            ProductUsageHistory.user_id == user_id,
            ProductUsageHistory.start_date >= cutoff,
            ProductUsageHistory.is_active.is_(True),
        )
        .all()
    )
    for u in added:
        changes.append({
            "product_id": u.product_id,
            "change_type": "added",
            "change_date": u.start_date,
            "days_since": (date.today() - u.start_date).days,
        })

    removed = (
        db.query(ProductUsageHistory)
        .filter(
            ProductUsageHistory.user_id == user_id,
            ProductUsageHistory.end_date >= cutoff,
            ProductUsageHistory.is_active.is_(False),
        )
        .all()
    )
    for u in removed:
        if u.end_date:
            changes.append({
                "product_id": u.product_id,
                "change_type": "removed",
                "change_date": u.end_date,
                "days_since": (date.today() - u.end_date).days,
            })

    changes.sort(key=lambda c: c["change_date"], reverse=True)
    return changes


def _temporal_correlation(
    change_date: date,
    detection_date: date,
    category: str,
) -> float:
    """Gaussian temporal correlation score."""
    delta_t = (detection_date - change_date).days
    if delta_t < 0:
        return 0.0
    tau = EXPECTED_EFFECT_LAG.get(category, 14)
    sigma = 7.0
    return float(np.exp(-((delta_t - tau) ** 2) / (2 * sigma ** 2)))


def _ingredient_relevance(product: Product, metric: str) -> float:
    metric_key = metric.replace("_norm", "")
    max_rel = 0.0
    for ing in (product.key_ingredients or []):
        name = ing.get("name_en", "")
        rel = INGREDIENT_EFFECT_MAP.get(name, {}).get(metric_key, 0.0)
        max_rel = max(max_rel, rel)
    return max_rel


def compute_product_influence(
    db: Session,
    user_id: str,
    detection_date: date,
    changed_metrics: list[str],
    change_direction: str,
) -> list[dict[str, Any]]:
    """Compute product impact probability for each recent product change."""
    product_changes = _detect_product_changes(db, user_id)
    if not product_changes:
        return []

    results: list[dict[str, Any]] = []
    for pc in product_changes:
        product = db.query(Product).filter(
            Product.product_id == pc["product_id"]
        ).first()
        if not product:
            continue

        p_temporal = _temporal_correlation(
            pc["change_date"], detection_date, product.category,
        )

        relevances = [_ingredient_relevance(product, m) for m in changed_metrics]
        p_ingredient = float(np.mean(relevances)) if relevances else 0.0

        past = (
            db.query(ProductEffectAnalysis)
            .filter(
                ProductEffectAnalysis.user_id == user_id,
                ProductEffectAnalysis.product_id == pc["product_id"],
            )
            .order_by(ProductEffectAnalysis.created_at.desc())
            .first()
        )
        if past:
            p_historical = min(abs(past.effect_score) / 50, 1.0) * past.confidence_level
        else:
            p_historical = 0.3

        p_impact = 0.4 * p_temporal + 0.35 * p_ingredient + 0.25 * p_historical

        if pc["change_type"] == "added":
            impact_dir = change_direction
        else:
            impact_dir = "negative" if change_direction == "improved" else "positive"

        results.append({
            "product_id": pc["product_id"],
            "product_name": product.product_name,
            "impact_probability": round(p_impact, 4),
            "impact_direction": impact_dir,
            "temporal_score": round(p_temporal, 4),
            "ingredient_score": round(p_ingredient, 4),
            "historical_score": round(p_historical, 4),
            "change_type": pc["change_type"],
            "days_since_change": pc["days_since"],
        })

    results.sort(key=lambda r: r["impact_probability"], reverse=True)
    return results


# ── 4. Combined detection signals ───────────────────────────────────────────

def get_detection_signals(
    db: Session,
    user_id: str,
    current_date: date | None = None,
) -> dict[str, Any]:
    """
    Run all detection pipelines and return combined signals.
    """
    current_date = current_date or date.today()

    improvement = detect_improvement(db, user_id, current_date)
    deterioration = detect_deterioration(db, user_id, current_date)

    # Determine overall direction
    if improvement.get("detected"):
        direction = "improved"
        changed_metrics = [
            m["metric"] for m in improvement.get("improved_metrics", [])
        ]
    elif deterioration.get("level", 0) > 0:
        direction = "deteriorated"
        det_data = (
            deterioration.get("alert", {})
            or deterioration.get("warning", {})
            or deterioration.get("watch", {})
        )
        changed_metrics = [
            m["metric"] for m in det_data.get("deteriorated_metrics", [])
        ]
    else:
        direction = "stable"
        changed_metrics = []

    # Product influence
    product_impacts: list[dict[str, Any]] = []
    if direction != "stable" and changed_metrics:
        product_impacts = compute_product_influence(
            db, user_id, current_date, changed_metrics, direction,
        )

    return {
        "date": current_date.isoformat(),
        "improvement": improvement,
        "deterioration": deterioration,
        "direction": direction,
        "product_impacts": [p for p in product_impacts if p["impact_probability"] >= 0.2],
    }


# ── 5. Alert throttler (in-memory, stateless per-request check) ─────────────

class AlertThrottler:
    """
    Stateless throttle check.
    In production this would query a notifications table;
    here we expose the interface for the router to use.
    """

    COOLDOWN_HOURS: dict[str, int] = {
        "improvement": 168,           # 7 days
        "deterioration_l1": 72,       # 3 days
        "deterioration_l2": 168,      # 7 days
        "deterioration_l3": 24,       # 1 day
        "product_impact": 0,          # per-product once
        "milestone": 24,
    }
    MAX_DAILY = 3
    MAX_WEEKLY = 7

    @staticmethod
    def should_send(
        user: User,
        alert_type: str,
    ) -> bool:
        """Basic check: respects user notification_enabled flag."""
        if not user.notification_enabled:
            return False
        return True
