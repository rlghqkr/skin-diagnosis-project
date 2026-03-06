from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.product import ProductCreate, ProductRead, ProductUsageCreate, ProductUsageRead
from app.services import product_service

router = APIRouter(prefix="/api/v1", tags=["products"])


@router.get("/products/search", response_model=list[ProductRead])
def search_products(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return product_service.search_products(db, q)


@router.get("/products/categories")
def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"categories": product_service.get_categories(db)}


@router.get("/products/{product_id}", response_model=ProductRead)
def get_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = product_service.get_product_by_id(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="제품을 찾을 수 없습니다.")
    return product


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return product_service.create_product(db, data)


@router.post("/usage", response_model=ProductUsageRead, status_code=status.HTTP_201_CREATED)
def create_usage(
    data: ProductUsageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data.user_id = current_user.user_id
    product = product_service.get_product_by_id(db, data.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="제품을 찾을 수 없습니다.")
    return product_service.create_usage(db, data)


@router.put("/usage/{usage_id}/end", response_model=ProductUsageRead)
def end_usage(
    usage_id: str,
    end_date: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    usage = product_service.get_usage_by_id(db, usage_id)
    if usage is None or usage.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용 이력을 찾을 수 없습니다.")
    return product_service.end_usage(db, usage, end_date)


@router.get("/usage/active", response_model=list[ProductUsageRead])
def list_active_usages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return product_service.get_active_usages(db, current_user.user_id)


@router.get("/usage/history", response_model=list[ProductUsageRead])
def list_usage_history(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return product_service.get_usage_history(db, current_user.user_id, limit)
