from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class RoutineStepSchema(BaseModel):
    order: int
    category: Literal[
        "cleanser",
        "toner",
        "essence",
        "serum",
        "ampoule",
        "cream",
        "eye_cream",
        "sunscreen",
        "mask",
        "other",
    ]
    product_id: str | None = None
    product_name: str
    amount: str | None = None
    duration_seconds: int | None = None
    notes: str | None = None


class SkincareRoutineCreate(BaseModel):
    user_id: str
    routine_date: date = Field(default_factory=date.today)
    time_of_day: Literal["morning", "night"]
    steps: list[RoutineStepSchema] = Field(default_factory=list)
    notes: str | None = None
    is_template: bool = False
    template_name: str | None = Field(None, max_length=100)


class SkincareRoutineRead(BaseModel):
    routine_id: str
    user_id: str
    routine_date: date
    time_of_day: str
    steps: list | None = None
    notes: str | None = None
    is_template: bool
    template_name: str | None = None
    total_products: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SkincareRoutineUpdate(BaseModel):
    routine_date: date | None = None
    time_of_day: Literal["morning", "night"] | None = None
    steps: list[RoutineStepSchema] | None = None
    notes: str | None = None
    is_template: bool | None = None
    template_name: str | None = Field(None, max_length=100)
