"""Tracking service - queries daily skin scores for trend/summary endpoints."""

from datetime import date, timedelta
from typing import Literal

from sqlalchemy import func as sqla_func
from sqlalchemy.orm import Session

from app.models.daily_skin_score import DailySkinScore


def get_scores(
    db: Session,
    user_id: str,
    period: Literal["daily", "weekly", "monthly"] = "daily",
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[DailySkinScore]:
    to_date = to_date or date.today()
    if from_date is None:
        days_map = {"daily": 30, "weekly": 90, "monthly": 365}
        from_date = to_date - timedelta(days=days_map.get(period, 30))

    return (
        db.query(DailySkinScore)
        .filter(
            DailySkinScore.user_id == user_id,
            DailySkinScore.score_date >= from_date,
            DailySkinScore.score_date <= to_date,
        )
        .order_by(DailySkinScore.score_date.asc())
        .all()
    )


def get_trend(db: Session, user_id: str) -> dict:
    """Return trend info: direction, velocity, recent average."""
    today = date.today()
    recent = (
        db.query(DailySkinScore)
        .filter(
            DailySkinScore.user_id == user_id,
            DailySkinScore.score_date >= today - timedelta(days=13),
        )
        .order_by(DailySkinScore.score_date.desc())
        .all()
    )

    if not recent:
        return {
            "trend_direction": "stable",
            "trend_velocity": 0.0,
            "recent_avg": None,
            "data_points": 0,
        }

    scores = [r.overall_score for r in recent]
    recent_avg = sum(scores) / len(scores)

    first_half = scores[len(scores) // 2:]
    second_half = scores[:len(scores) // 2] if len(scores) // 2 > 0 else scores
    first_avg = sum(first_half) / len(first_half) if first_half else 0
    second_avg = sum(second_half) / len(second_half) if second_half else 0

    velocity = round((second_avg - first_avg) / 2.0, 2)  # points per week approx

    if velocity > 0.3:
        direction = "improving"
    elif velocity < -0.3:
        direction = "declining"
    else:
        direction = "stable"

    return {
        "trend_direction": direction,
        "trend_velocity": velocity,
        "recent_avg": round(recent_avg, 1),
        "data_points": len(recent),
    }


def get_summary(db: Session, user_id: str, period: str = "monthly", from_date: date | None = None, to_date: date | None = None) -> dict:
    """Return summary statistics for a period."""
    to_date = to_date or date.today()
    if from_date is None:
        days_map = {"weekly": 7, "monthly": 30, "quarterly": 90}
        from_date = to_date - timedelta(days=days_map.get(period, 30))

    result = (
        db.query(
            sqla_func.avg(DailySkinScore.overall_score),
            sqla_func.max(DailySkinScore.overall_score),
            sqla_func.min(DailySkinScore.overall_score),
            sqla_func.count(DailySkinScore.score_id),
        )
        .filter(
            DailySkinScore.user_id == user_id,
            DailySkinScore.score_date >= from_date,
            DailySkinScore.score_date <= to_date,
        )
        .first()
    )

    avg_score, max_score, min_score, count = result

    # Per-metric averages
    metric_avgs = (
        db.query(
            sqla_func.avg(DailySkinScore.hydration_norm),
            sqla_func.avg(DailySkinScore.elasticity_norm),
            sqla_func.avg(DailySkinScore.pore_norm),
            sqla_func.avg(DailySkinScore.wrinkle_norm),
            sqla_func.avg(DailySkinScore.pigmentation_norm),
        )
        .filter(
            DailySkinScore.user_id == user_id,
            DailySkinScore.score_date >= from_date,
            DailySkinScore.score_date <= to_date,
        )
        .first()
    )

    return {
        "period": period,
        "from_date": from_date.isoformat(),
        "to_date": to_date.isoformat(),
        "avg_score": round(float(avg_score), 1) if avg_score else None,
        "max_score": int(max_score) if max_score else None,
        "min_score": int(min_score) if min_score else None,
        "measurement_count": int(count),
        "metric_averages": {
            "hydration": round(float(metric_avgs[0]), 4) if metric_avgs[0] else None,
            "elasticity": round(float(metric_avgs[1]), 4) if metric_avgs[1] else None,
            "pore": round(float(metric_avgs[2]), 4) if metric_avgs[2] else None,
            "wrinkle": round(float(metric_avgs[3]), 4) if metric_avgs[3] else None,
            "pigmentation": round(float(metric_avgs[4]), 4) if metric_avgs[4] else None,
        },
    }
