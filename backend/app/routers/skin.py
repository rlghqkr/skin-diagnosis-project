from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.skin import SkinMeasurementCreate, SkinMeasurementRead
from app.services import measurement_service

router = APIRouter(prefix="/api/v1/skin", tags=["skin"])


@router.post("/measure", response_model=SkinMeasurementRead, status_code=status.HTTP_201_CREATED)
def save_measurement(
    data: SkinMeasurementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a skin measurement result and auto-create daily skin score."""
    data.user_id = current_user.user_id
    measurement = measurement_service.create_measurement(db, data)
    return measurement


@router.get("/latest", response_model=SkinMeasurementRead | None)
def get_latest_measurement(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return measurement_service.get_latest_measurement(db, current_user.user_id)
