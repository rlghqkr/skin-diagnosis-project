"""
Seed products table from data/cosmetics.json.

Usage:
    cd nia
    python -m backend.scripts.seed_products
"""

import json
import sys
from pathlib import Path

# Ensure backend package is importable
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app.database import Base, engine, SessionLocal
from app.models.product import Product

# Korean category -> English category mapping
CATEGORY_MAP = {
    "클렌저": "cleanser",
    "토너": "toner",
    "에센스": "essence",
    "세럼": "serum",
    "앰플": "ampoule",
    "크림": "cream",
    "아이크림": "eye_cream",
    "선크림": "sunscreen",
    "마스크팩": "mask",
    "마스크": "mask",
    "로션": "cream",
    "오일": "serum",
    "필링": "other",
    "미스트": "toner",
}


def seed():
    data_path = ROOT / "data" / "cosmetics.json"
    if not data_path.exists():
        print(f"ERROR: {data_path} not found")
        sys.exit(1)

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    products = data.get("products", [])
    if not products:
        print("No products found in cosmetics.json")
        return

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    added = 0
    skipped = 0

    try:
        for item in products:
            # Check if product already exists by brand + name
            existing = (
                db.query(Product)
                .filter(
                    Product.brand == item.get("brand", ""),
                    Product.product_name == item.get("name", ""),
                )
                .first()
            )
            if existing:
                skipped += 1
                continue

            category_ko = item.get("category", "기타")
            category_en = CATEGORY_MAP.get(category_ko, "other")

            key_ingredients = []
            for ing in item.get("ingredients", []):
                key_ingredients.append({"name_ko": ing, "benefit": "", "target_concerns": []})

            product = Product(
                brand=item.get("brand", ""),
                product_name=item.get("name", ""),
                category=category_en,
                ingredients=[],
                key_ingredients=key_ingredients,
                description=item.get("description", ""),
                is_active=True,
            )
            db.add(product)
            added += 1

        db.commit()
        print(f"Seeding complete: {added} added, {skipped} skipped (already exist)")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
