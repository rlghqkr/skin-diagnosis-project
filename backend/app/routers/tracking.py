from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.tracking import DailySkinScoreRead
from app.services import tracking_service

router = APIRouter(prefix="/api/v1/tracking", tags=["tracking"])


@router.get("/scores", response_model=list[DailySkinScoreRead])
def get_scores(
    period: Literal["daily", "weekly", "monthly"] = "daily",
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return tracking_service.get_scores(db, current_user.user_id, period, from_date, to_date)


@router.get("/trend")
def get_trend(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return tracking_service.get_trend(db, current_user.user_id)


@router.get("/summary")
def get_summary(
    period: str = "monthly",
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return tracking_service.get_summary(db, current_user.user_id, period, from_date, to_date)
