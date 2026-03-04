"""
NIA 데이터 유효성 검증 스크립트

화장품 DB, 피부타입 매핑, 성분 매핑의 무결성을 검증하고
E2E 추천 파이프라인을 테스트한다.

Usage:
    python tool/validate_data.py
"""

import json
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# Valid enum values from schema
VALID_CATEGORIES = {"클렌저", "토너", "세럼/에센스", "크림/로션", "선크림", "마스크팩", "아이크림"}
VALID_EFFECTS = {"보습", "미백", "주름개선", "탄력", "모공관리", "각질관리", "진정", "항산화", "장벽강화", "피지조절"}
VALID_SKIN_TYPES = {"건성", "지성", "복합성", "민감성", "중성", "모든피부"}
VALID_CONCERNS = {"건조", "색소침착", "모공", "탄력저하", "주름", "피지과다", "민감", "칙칙함"}
VALID_PRICE_RANGES = {"저가(~1만원)", "중저가(1~2만원)", "중가(2~4만원)", "중고가(4~7만원)", "고가(7만원~)"}

errors = []
warnings = []


def error(msg: str):
    errors.append(msg)
    print(f"  [ERROR] {msg}")


def warn(msg: str):
    warnings.append(msg)
    print(f"  [WARN]  {msg}")


def ok(msg: str):
    print(f"  [OK]    {msg}")


# ---------------------------------------------------------------------------
# 1. Cosmetics data validation
# ---------------------------------------------------------------------------
def validate_cosmetics():
    print("\n=== 1. Cosmetics Data Validation ===")

    path = DATA_DIR / "cosmetics.json"
    if not path.exists():
        error("cosmetics.json not found")
        return []

    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    products = data.get("products", [])
    if not products:
        error("No products found")
        return []

    ok(f"Loaded {len(products)} products")

    if len(products) < 70:
        warn(f"Only {len(products)} products (target: 70+)")

    # Check unique IDs
    ids = [p["id"] for p in products]
    dup_ids = [i for i in ids if ids.count(i) > 1]
    if dup_ids:
        error(f"Duplicate IDs: {set(dup_ids)}")
    else:
        ok("All product IDs are unique")

    # Validate each product
    required_fields = ["id", "name", "brand", "category", "price_range", "description",
                       "ingredients", "effects", "suitable_skin_types", "suitable_concerns"]

    for product in products:
        pid = product.get("id", "UNKNOWN")

        # Required fields
        for field in required_fields:
            if field not in product:
                error(f"{pid}: missing required field '{field}'")

        # Category
        cat = product.get("category", "")
        if cat not in VALID_CATEGORIES:
            error(f"{pid}: invalid category '{cat}'")

        # Effects
        for effect in product.get("effects", []):
            if effect not in VALID_EFFECTS:
                error(f"{pid}: invalid effect '{effect}'")

        # Skin types
        for st in product.get("suitable_skin_types", []):
            if st not in VALID_SKIN_TYPES:
                error(f"{pid}: invalid skin type '{st}'")

        # Concerns
        for concern in product.get("suitable_concerns", []):
            if concern not in VALID_CONCERNS:
                error(f"{pid}: invalid concern '{concern}'")

        # Price range
        pr = product.get("price_range", "")
        if pr not in VALID_PRICE_RANGES:
            error(f"{pid}: invalid price_range '{pr}'")

        # Rating
        rating = product.get("rating")
        if rating is not None and not (0 <= rating <= 5):
            error(f"{pid}: rating {rating} out of range [0, 5]")

        # Ingredients not empty
        if not product.get("ingredients"):
            error(f"{pid}: empty ingredients list")

        # Effects not empty
        if not product.get("effects"):
            error(f"{pid}: empty effects list")

    # Category distribution
    from collections import Counter
    cat_counts = Counter(p["category"] for p in products)
    ok(f"Category distribution: {dict(cat_counts)}")

    # Brand count
    brands = set(p["brand"] for p in products)
    ok(f"Unique brands: {len(brands)}")

    return products


# ---------------------------------------------------------------------------
# 2. Skin type mapping validation
# ---------------------------------------------------------------------------
def validate_skin_type_mapping():
    print("\n=== 2. Skin Type Mapping Validation ===")

    path = DATA_DIR / "skin_type_mapping.json"
    if not path.exists():
        error("skin_type_mapping.json not found")
        return None

    with open(path, encoding="utf-8") as f:
        mapping = json.load(f)

    # Check required sections
    required_sections = [
        "skin_type_classification",
        "classification_grade_mapping",
        "regression_value_mapping",
        "concern_priority_order",
        "sensitivity_indicators",
    ]
    for section in required_sections:
        if section not in mapping:
            error(f"Missing section: {section}")
        else:
            ok(f"Section '{section}' present")

    # Validate classification grade mapping
    class_map = mapping.get("classification_grade_mapping", {})
    expected_class_metrics = {"dryness", "pigmentation", "pore", "sagging", "wrinkle"}
    actual_class_metrics = set(class_map.keys())
    missing = expected_class_metrics - actual_class_metrics
    if missing:
        error(f"Missing classification metrics: {missing}")
    else:
        ok("All classification metrics present")

    for metric, config in class_map.items():
        if not isinstance(config, dict):
            continue
        levels = config.get("levels", {})
        all_grades = []
        for lv_grades in levels.values():
            all_grades.extend(lv_grades)
        expected_grades = config.get("grades", [])
        if sorted(all_grades) != sorted(expected_grades):
            error(f"{metric}: grade coverage mismatch (levels={sorted(all_grades)}, expected={sorted(expected_grades)})")

    # Validate regression value mapping
    reg_map = mapping.get("regression_value_mapping", {})
    expected_reg_metrics = {"pigmentation", "moisture", "elasticity_R2", "wrinkle_Ra", "pore"}
    actual_reg_metrics = set(reg_map.keys())
    missing = expected_reg_metrics - actual_reg_metrics
    if missing:
        error(f"Missing regression metrics: {missing}")
    else:
        ok("All regression metrics present")

    return mapping


# ---------------------------------------------------------------------------
# 3. Ingredients mapping validation
# ---------------------------------------------------------------------------
def validate_ingredients_mapping(products):
    print("\n=== 3. Ingredients Mapping Validation ===")

    path = DATA_DIR / "ingredients_mapping.json"
    if not path.exists():
        error("ingredients_mapping.json not found")
        return None

    with open(path, encoding="utf-8") as f:
        mapping = json.load(f)

    ingredients_db = mapping.get("ingredients", {})
    effect_map = mapping.get("effect_to_ingredients", {})

    ok(f"Ingredients DB: {len(ingredients_db)} entries")
    ok(f"Effect-to-ingredient mappings: {len(effect_map)} effects")

    # Validate ingredient entries
    for name, info in ingredients_db.items():
        for effect in info.get("effects", []):
            if effect not in VALID_EFFECTS:
                error(f"Ingredient '{name}': invalid effect '{effect}'")
        for st in info.get("suitable_skin_types", []):
            if st not in VALID_SKIN_TYPES:
                error(f"Ingredient '{name}': invalid skin type '{st}'")

    # Validate effect_to_ingredients references
    for effect, ing_list in effect_map.items():
        if effect.startswith("_"):
            continue
        if effect not in VALID_EFFECTS:
            error(f"effect_to_ingredients: invalid effect key '{effect}'")
        for ing_name in ing_list:
            if ing_name not in ingredients_db:
                error(f"effect_to_ingredients[{effect}]: ingredient '{ing_name}' not in ingredients DB")

    # Check referential integrity: product ingredients vs ingredients DB
    if products:
        all_product_ingredients = set()
        for p in products:
            all_product_ingredients.update(p.get("ingredients", []))

        unregistered = all_product_ingredients - set(ingredients_db.keys())
        if unregistered:
            warn(f"Product ingredients not in ingredients DB: {unregistered}")
        else:
            ok("All product ingredients are registered in ingredients DB")

    return mapping


# ---------------------------------------------------------------------------
# 4. E2E recommendation pipeline test
# ---------------------------------------------------------------------------
def validate_e2e_pipeline():
    print("\n=== 4. E2E Recommendation Pipeline Test ===")

    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from tool.cosmetics_db import (
        classify_skin_type,
        analyze_skin,
        recommend_products,
        get_recommended_ingredients,
        check_ingredient_cautions,
        clear_cache,
    )

    clear_cache()

    # Test case 1: Dry + sensitive skin with severe concerns
    print("\n  --- Test Case 1: Dry sensitive skin ---")
    class_r = {
        "dryness": {"grade": 4},
        "pigmentation": {"grade": 4},
        "pore": {"grade": 1},
        "sagging": {"grade": 3},
        "wrinkle": {"grade": 5},
    }
    reg_r = {
        "moisture": {"value": 20},
        "elasticity_R2": {"value": 0.3},
        "wrinkle_Ra": {"value": 35},
        "pore": {"value": 400},
        "pigmentation": {"value": 70},
    }
    result = recommend_products(class_r, reg_r, limit=5)
    analysis = result["analysis"]
    recs = result["recommendations"]

    assert analysis["skin_type"] in VALID_SKIN_TYPES, f"Invalid skin type: {analysis['skin_type']}"
    ok(f"Skin type: {analysis['skin_type']}")
    ok(f"Is sensitive: {analysis['is_sensitive']}")
    ok(f"Concerns: {len(analysis['concerns'])} items")
    ok(f"Recommended effects: {analysis['recommended_effects']}")
    ok(f"Recommendations: {len(recs)} products")

    if not recs:
        warn("No recommendations for test case 1")
    else:
        for r in recs[:3]:
            ok(f"  -> {r['brand']} {r['name']} ({r['category']})")

    # Test case 2: Oily skin with pore concerns
    print("\n  --- Test Case 2: Oily skin with pore concerns ---")
    clear_cache()
    class_r2 = {
        "dryness": {"grade": 0},
        "pigmentation": {"grade": 1},
        "pore": {"grade": 5},
        "sagging": {"grade": 0},
        "wrinkle": {"grade": 1},
    }
    reg_r2 = {
        "moisture": {"value": 70},
        "elasticity_R2": {"value": 0.8},
        "wrinkle_Ra": {"value": 8},
        "pore": {"value": 2200},
        "pigmentation": {"value": 250},
    }
    result2 = recommend_products(class_r2, reg_r2, limit=5)
    analysis2 = result2["analysis"]
    recs2 = result2["recommendations"]

    ok(f"Skin type: {analysis2['skin_type']}")
    ok(f"Is sensitive: {analysis2['is_sensitive']}")
    ok(f"Recommendations: {len(recs2)} products")

    if not recs2:
        warn("No recommendations for test case 2")

    # Test case 3: Normal skin (minimal concerns)
    print("\n  --- Test Case 3: Normal/healthy skin ---")
    clear_cache()
    class_r3 = {
        "dryness": {"grade": 0},
        "pigmentation": {"grade": 0},
        "pore": {"grade": 0},
        "sagging": {"grade": 0},
        "wrinkle": {"grade": 0},
    }
    reg_r3 = {
        "moisture": {"value": 50},
        "elasticity_R2": {"value": 0.85},
        "wrinkle_Ra": {"value": 5},
        "pore": {"value": 300},
        "pigmentation": {"value": 280},
    }
    result3 = recommend_products(class_r3, reg_r3, limit=5)
    analysis3 = result3["analysis"]
    ok(f"Skin type: {analysis3['skin_type']}")
    ok(f"Concerns: {len(analysis3['concerns'])} (expected 0 for healthy skin)")

    # Test ingredient recommendation
    print("\n  --- Ingredient Recommendation Test ---")
    clear_cache()
    rec_ings = get_recommended_ingredients(["보습", "미백"])
    ok(f"Ingredients for moisturize+whitening: {len(rec_ings)} items")
    assert len(rec_ings) > 0, "No ingredients recommended"

    # Test skin type classification edge cases
    print("\n  --- Skin Type Classification Edge Cases ---")
    clear_cache()
    assert classify_skin_type([]) == "중성", "Empty should return normal"
    ok("Empty moisture -> normal skin")
    assert classify_skin_type([0]) == "건성", "0% should be dry"
    ok("0% moisture -> dry skin")
    assert classify_skin_type([100]) == "지성", "100% should be oily"
    ok("100% moisture -> oily skin")
    assert classify_skin_type([20, 70]) == "복합성", "Large diff should be combination"
    ok("20-70% diff -> combination skin")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("NIA Data Validation Report")
    print("=" * 60)

    products = validate_cosmetics()
    validate_skin_type_mapping()
    validate_ingredients_mapping(products)
    validate_e2e_pipeline()

    print("\n" + "=" * 60)
    print(f"RESULT: {len(errors)} errors, {len(warnings)} warnings")
    print("=" * 60)

    if errors:
        print("\nErrors:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\nAll validations PASSED!")
        sys.exit(0)


if __name__ == "__main__":
    main()
