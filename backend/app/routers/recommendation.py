from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.jwt import verify_token
from app.database import get_db
from app.schemas.recommendation import (
    CategoryScoreInput,
    PlatformRecommendationResponse,
)
from app.services import recommendation_service

router = APIRouter(prefix="/api/v1", tags=["recommendations"])

_optional_bearer = HTTPBearer(auto_error=False)


def _get_optional_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_optional_bearer),
) -> str | None:
    if credentials is None:
        return None
    return verify_token(credentials.credentials, expected_type="access")


@router.post(
    "/recommendations/platform",
    response_model=PlatformRecommendationResponse,
)
def get_platform_recommendations(
    categories: list[CategoryScoreInput],
    user_id: str | None = Depends(_get_optional_user_id),
    db: Session = Depends(get_db),
):
    cat_dicts = [c.model_dump() for c in categories]
    result = recommendation_service.get_platform_recommendations(
        db, cat_dicts, user_id
    )
    return result
