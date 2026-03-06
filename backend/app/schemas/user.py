from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: str = Field(..., max_length=255)
    nickname: str = Field(..., max_length=50)
    password: str = Field(..., min_length=8)
    age: int | None = Field(None, ge=10, le=120)
    gender: Literal["male", "female", "other"] | None = None
    skin_type: Literal["dry", "oily", "combination", "sensitive", "normal"] | None = (
        None
    )
    skin_concerns: list[str] = Field(default_factory=list)


class UserRead(BaseModel):
    user_id: str
    email: str
    nickname: str
    age: int | None = None
    gender: str | None = None
    skin_type: str | None = None
    skin_concerns: list | None = None
    baseline_skin_score: int | None = None
    profile_image_url: str | None = None
    notification_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    nickname: str | None = Field(None, max_length=50)
    age: int | None = Field(None, ge=10, le=120)
    gender: Literal["male", "female", "other"] | None = None
    skin_type: Literal["dry", "oily", "combination", "sensitive", "normal"] | None = (
        None
    )
    skin_concerns: list[str] | None = None
    baseline_skin_score: int | None = Field(None, ge=0, le=100)
    profile_image_url: str | None = Field(None, max_length=500)
    notification_enabled: bool | None = None
