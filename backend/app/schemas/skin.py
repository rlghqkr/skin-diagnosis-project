from datetime import datetime

from pydantic import BaseModel, Field


class SkinMeasurementCreate(BaseModel):
    user_id: str
    hydration_score: float = Field(..., ge=0, le=100)
    elasticity_score: float = Field(..., ge=0, le=1)
    pore_score: float = Field(..., ge=0, le=2600)
    wrinkle_score: float = Field(..., ge=0, le=50)
    pigmentation_score: float = Field(..., ge=0, le=350)
    overall_skin_score: int = Field(..., ge=0, le=100)
    classification_data: dict | None = None
    regression_data: dict | None = None
    image_url: str | None = Field(None, max_length=500)
    capture_metadata: dict | None = None


class SkinMeasurementRead(BaseModel):
    measurement_id: str
    user_id: str
    measured_at: datetime
    hydration_score: float
    elasticity_score: float
    pore_score: float
    wrinkle_score: float
    pigmentation_score: float
    overall_skin_score: int
    classification_data: dict | None = None
    regression_data: dict | None = None
    image_url: str | None = None
    capture_metadata: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
