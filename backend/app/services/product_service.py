from datetime import date

from sqlalchemy import or_
from sqlalchemy.orm import Session

from sqlalchemy import distinct

from app.models.product import Product
from app.models.product_usage import ProductUsageHistory
from app.schemas.product import ProductCreate, ProductUsageCreate, ProductUsageUpdate


def search_products(
    db: Session, query: str, limit: int = 20
) -> list[Product]:
    pattern = f"%{query}%"
    return (
        db.query(Product)
        .filter(
            Product.is_active == True,
            or_(
                Product.product_name.ilike(pattern),
                Product.brand.ilike(pattern),
            ),
        )
        .limit(limit)
        .all()
    )


def get_product_by_id(db: Session, product_id: str) -> Product | None:
    return db.query(Product).filter(Product.product_id == product_id).first()


def create_usage(db: Session, data: ProductUsageCreate) -> ProductUsageHistory:
    usage = ProductUsageHistory(
        user_id=data.user_id,
        product_id=data.product_id,
        start_date=data.start_date,
        end_date=data.end_date,
        frequency=data.frequency,
        time_of_day=data.time_of_day,
        satisfaction_rating=data.satisfaction_rating,
        notes=data.notes,
    )
    db.add(usage)
    db.commit()
    db.refresh(usage)
    return usage


def end_usage(db: Session, usage: ProductUsageHistory, end_date: date | None = None) -> ProductUsageHistory:
    usage.end_date = end_date or date.today()
    usage.is_active = False
    db.commit()
    db.refresh(usage)
    return usage


def get_usage_by_id(db: Session, usage_id: str) -> ProductUsageHistory | None:
    return (
        db.query(ProductUsageHistory)
        .filter(ProductUsageHistory.usage_id == usage_id)
        .first()
    )


def get_active_usages(db: Session, user_id: str) -> list[ProductUsageHistory]:
    return (
        db.query(ProductUsageHistory)
        .filter(
            ProductUsageHistory.user_id == user_id,
            ProductUsageHistory.is_active == True,
        )
        .order_by(ProductUsageHistory.start_date.desc())
        .all()
    )


def get_usage_history(db: Session, user_id: str, limit: int = 50) -> list[ProductUsageHistory]:
    return (
        db.query(ProductUsageHistory)
        .filter(ProductUsageHistory.user_id == user_id)
        .order_by(ProductUsageHistory.start_date.desc())
        .limit(limit)
        .all()
    )


def get_categories(db: Session) -> list[str]:
    rows = (
        db.query(distinct(Product.category))
        .filter(Product.is_active == True)
        .order_by(Product.category)
        .all()
    )
    return [row[0] for row in rows]


def create_product(db: Session, data: ProductCreate) -> Product:
    product = Product(
        brand=data.brand,
        product_name=data.product_name,
        category=data.category,
        subcategory=data.subcategory,
        ingredients=data.ingredients,
        key_ingredients=data.key_ingredients,
        image_url=data.image_url,
        price=data.price,
        volume=data.volume,
        description=data.description,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
