from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    brand: str = Field(..., max_length=100)
    product_name: str = Field(..., max_length=255)
    category: str = Field(..., max_length=50)
    subcategory: str | None = Field(None, max_length=50)
    ingredients: list | None = Field(default_factory=list)
    key_ingredients: list | None = Field(default_factory=list)
    image_url: str | None = Field(None, max_length=500)
    price: float | None = Field(None, ge=0)
    volume: str | None = Field(None, max_length=50)
    description: str | None = None


class ProductRead(BaseModel):
    product_id: str
    brand: str
    product_name: str
    category: str
    subcategory: str | None = None
    ingredients: list | None = None
    key_ingredients: list | None = None
    image_url: str | None = None
    price: float | None = None
    volume: str | None = None
    description: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductUpdate(BaseModel):
    brand: str | None = Field(None, max_length=100)
    product_name: str | None = Field(None, max_length=255)
    category: str | None = Field(None, max_length=50)
    subcategory: str | None = Field(None, max_length=50)
    ingredients: list | None = None
    key_ingredients: list | None = None
    image_url: str | None = Field(None, max_length=500)
    price: float | None = Field(None, ge=0)
    volume: str | None = Field(None, max_length=50)
    description: str | None = None
    is_active: bool | None = None


class ProductUsageCreate(BaseModel):
    user_id: str
    product_id: str
    start_date: date
    end_date: date | None = None
    frequency: Literal["daily", "weekly", "occasional"] = "daily"
    time_of_day: Literal["morning", "night", "both"] = "both"
    satisfaction_rating: int | None = Field(None, ge=1, le=5)
    notes: str | None = None


class ProductUsageRead(BaseModel):
    usage_id: str
    user_id: str
    product_id: str
    start_date: date
    end_date: date | None = None
    frequency: str | None = None
    time_of_day: str | None = None
    satisfaction_rating: int | None = None
    is_active: bool
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductUsageUpdate(BaseModel):
    end_date: date | None = None
    frequency: Literal["daily", "weekly", "occasional"] | None = None
    time_of_day: Literal["morning", "night", "both"] | None = None
    satisfaction_rating: int | None = Field(None, ge=1, le=5)
    is_active: bool | None = None
    notes: str | None = None
