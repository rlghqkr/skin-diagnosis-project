"""Measurement service - saves skin analysis results to DB and creates daily scores."""

from datetime import date, timedelta

from sqlalchemy import func as sqla_func
from sqlalchemy.orm import Session

from app.models.daily_skin_score import DailySkinScore
from app.models.skin_measurement import SkinMeasurement
from app.schemas.skin import SkinMeasurementCreate

# Normalization ranges: (min, max, higher_is_better)
_NORM_RANGES = {
    "hydration": (0.0, 100.0, True),
    "elasticity": (0.0, 1.0, True),
    "pore": (0.0, 2600.0, False),
    "wrinkle": (0.0, 50.0, False),
    "pigmentation": (0.0, 350.0, True),
}


def _normalize(value: float, lo: float, hi: float, higher_is_better: bool) -> float:
    if hi == lo:
        return 0.5
    clamped = max(lo, min(hi, value))
    norm = (clamped - lo) / (hi - lo)
    return norm if higher_is_better else (1.0 - norm)


def create_measurement(db: Session, data: SkinMeasurementCreate) -> SkinMeasurement:
    measurement = SkinMeasurement(
        user_id=data.user_id,
        hydration_score=data.hydration_score,
        elasticity_score=data.elasticity_score,
        pore_score=data.pore_score,
        wrinkle_score=data.wrinkle_score,
        pigmentation_score=data.pigmentation_score,
        overall_skin_score=data.overall_skin_score,
        classification_data=data.classification_data,
        regression_data=data.regression_data,
        image_url=data.image_url,
        capture_metadata=data.capture_metadata,
    )
    db.add(measurement)
    db.flush()

    # Create/update daily skin score
    today = date.today()
    hydration_norm = _normalize(data.hydration_score, *_NORM_RANGES["hydration"])
    elasticity_norm = _normalize(data.elasticity_score, *_NORM_RANGES["elasticity"])
    pore_norm = _normalize(data.pore_score, *_NORM_RANGES["pore"])
    wrinkle_norm = _normalize(data.wrinkle_score, *_NORM_RANGES["wrinkle"])
    pigmentation_norm = _normalize(data.pigmentation_score, *_NORM_RANGES["pigmentation"])

    # Compute 7-day moving average
    recent_scores = (
        db.query(DailySkinScore.overall_score)
        .filter(
            DailySkinScore.user_id == data.user_id,
            DailySkinScore.score_date >= today - timedelta(days=6),
            DailySkinScore.score_date < today,
        )
        .all()
    )
    past_scores = [r[0] for r in recent_scores]
    all_scores = past_scores + [data.overall_skin_score]
    ma_7 = round(sum(all_scores) / len(all_scores), 2) if all_scores else float(data.overall_skin_score)

    # Determine trend from last 14 days
    trend_direction = _compute_trend(db, data.user_id, today, data.overall_skin_score)

    existing = (
        db.query(DailySkinScore)
        .filter(
            DailySkinScore.user_id == data.user_id,
            DailySkinScore.score_date == today,
        )
        .first()
    )

    if existing:
        existing.measurement_id = measurement.measurement_id
        existing.overall_score = data.overall_skin_score
        existing.hydration_norm = round(hydration_norm, 4)
        existing.elasticity_norm = round(elasticity_norm, 4)
        existing.pore_norm = round(pore_norm, 4)
        existing.wrinkle_norm = round(wrinkle_norm, 4)
        existing.pigmentation_norm = round(pigmentation_norm, 4)
        existing.ma_7_score = ma_7
        existing.trend_direction = trend_direction
    else:
        daily = DailySkinScore(
            user_id=data.user_id,
            measurement_id=measurement.measurement_id,
            score_date=today,
            overall_score=data.overall_skin_score,
            hydration_norm=round(hydration_norm, 4),
            elasticity_norm=round(elasticity_norm, 4),
            pore_norm=round(pore_norm, 4),
            wrinkle_norm=round(wrinkle_norm, 4),
            pigmentation_norm=round(pigmentation_norm, 4),
            ma_7_score=ma_7,
            trend_direction=trend_direction,
        )
        db.add(daily)

    db.commit()
    db.refresh(measurement)
    return measurement


def _compute_trend(db: Session, user_id: str, today: date, current_score: int) -> str:
    """Simple trend computation: compare last 7-day avg with previous 7-day avg."""
    recent = (
        db.query(sqla_func.avg(DailySkinScore.overall_score))
        .filter(
            DailySkinScore.user_id == user_id,
            DailySkinScore.score_date >= today - timedelta(days=6),
            DailySkinScore.score_date < today,
        )
        .scalar()
    )
    older = (
        db.query(sqla_func.avg(DailySkinScore.overall_score))
        .filter(
            DailySkinScore.user_id == user_id,
            DailySkinScore.score_date >= today - timedelta(days=13),
            DailySkinScore.score_date < today - timedelta(days=6),
        )
        .scalar()
    )

    if recent is None or older is None:
        return "stable"

    diff = float(recent) - float(older)
    if diff > 2.0:
        return "improving"
    elif diff < -2.0:
        return "declining"
    return "stable"


def get_latest_measurement(db: Session, user_id: str) -> SkinMeasurement | None:
    return (
        db.query(SkinMeasurement)
        .filter(SkinMeasurement.user_id == user_id)
        .order_by(SkinMeasurement.measured_at.desc())
        .first()
    )
