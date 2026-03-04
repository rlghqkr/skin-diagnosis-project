"""
NIA 화장품 데이터베이스 유틸리티

화장품 데이터 로드, 검색, 피부타입 매핑 기능 제공.
"""

import json
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

_cosmetics_cache: Optional[list[dict]] = None
_skin_type_mapping_cache: Optional[dict] = None
_ingredients_mapping_cache: Optional[dict] = None


def load_cosmetics() -> list[dict]:
    """화장품 데이터를 로드하고 캐싱한다."""
    global _cosmetics_cache
    if _cosmetics_cache is not None:
        return _cosmetics_cache

    path = DATA_DIR / "cosmetics.json"
    if not path.exists():
        return []

    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    _cosmetics_cache = data.get("products", [])
    return _cosmetics_cache


def load_skin_type_mapping() -> dict:
    """피부타입 매핑 테이블을 로드하고 캐싱한다."""
    global _skin_type_mapping_cache
    if _skin_type_mapping_cache is not None:
        return _skin_type_mapping_cache

    path = DATA_DIR / "skin_type_mapping.json"
    with open(path, encoding="utf-8") as f:
        _skin_type_mapping_cache = json.load(f)

    return _skin_type_mapping_cache


def load_ingredients_mapping() -> dict:
    """성분-효능 매핑 데이터를 로드하고 캐싱한다."""
    global _ingredients_mapping_cache
    if _ingredients_mapping_cache is not None:
        return _ingredients_mapping_cache

    path = DATA_DIR / "ingredients_mapping.json"
    if not path.exists():
        return {}

    with open(path, encoding="utf-8") as f:
        _ingredients_mapping_cache = json.load(f)

    return _ingredients_mapping_cache


def clear_cache():
    """캐시를 초기화한다. 테스트용."""
    global _cosmetics_cache, _skin_type_mapping_cache, _ingredients_mapping_cache
    _cosmetics_cache = None
    _skin_type_mapping_cache = None
    _ingredients_mapping_cache = None


# ---------------------------------------------------------------------------
# Skin type classification from measurements
# ---------------------------------------------------------------------------

def classify_skin_type(moisture_values: list[float]) -> str:
    """
    부위별 수분 측정값으로 피부타입을 판단한다.

    Args:
        moisture_values: 부위별 수분 측정값 리스트 (0-100%)

    Returns:
        "건성", "중성", "지성", 또는 "복합성"
    """
    if not moisture_values:
        return "중성"

    mapping = load_skin_type_mapping()
    moisture_rules = mapping["skin_type_classification"]["moisture"]
    combination_threshold = mapping["skin_type_classification"]["combination_rule"]["threshold"]

    # 복합성 판단: 부위별 수분 편차가 threshold 이상
    if len(moisture_values) > 1:
        diff = max(moisture_values) - min(moisture_values)
        if diff >= combination_threshold:
            return "복합성"

    avg = sum(moisture_values) / len(moisture_values)

    for skin_type, rule in moisture_rules.items():
        if rule["min"] <= avg < rule["max"]:
            return skin_type

    # edge case: avg == 100
    if avg >= moisture_rules["지성"]["min"]:
        return "지성"

    return "중성"


def evaluate_concern_level_classification(metric: str, grade: int) -> dict:
    """
    분류 등급으로 고민 수준을 평가한다.

    Args:
        metric: 메트릭명 (dryness, pigmentation, pore, sagging, wrinkle)
        grade: 등급 값

    Returns:
        {"concern": str, "level": str, "effects_needed": list[str]}
    """
    mapping = load_skin_type_mapping()
    grade_map = mapping["classification_grade_mapping"]

    if metric not in grade_map:
        return {"concern": "", "level": "양호", "effects_needed": []}

    config = grade_map[metric]
    concern = config["concern"]

    level = "양호"
    for lv, grades in config["levels"].items():
        if grade in grades:
            level = lv
            break

    effects_needed = config.get("effects_needed", {}).get(level, [])

    return {"concern": concern, "level": level, "effects_needed": effects_needed}


def evaluate_concern_level_regression(metric: str, value: float) -> dict:
    """
    회귀 수치로 고민 수준을 평가한다.

    Args:
        metric: 메트릭명 (pigmentation, moisture, elasticity_R2, wrinkle_Ra, pore)
        value: 측정값

    Returns:
        {"concern": str, "level": str, "effects_needed": list[str]}
    """
    mapping = load_skin_type_mapping()
    reg_map = mapping["regression_value_mapping"]

    if metric not in reg_map:
        return {"concern": "", "level": "양호", "effects_needed": []}

    config = reg_map[metric]
    concern = config["concern"]

    level = "양호"
    for lv, bounds in config["levels"].items():
        if bounds["min"] <= value <= bounds["max"]:
            level = lv
            break

    effects_needed = config.get("effects_needed", {}).get(level, [])

    return {"concern": concern, "level": level, "effects_needed": effects_needed}


def analyze_skin(class_results: dict, regression_results: dict) -> dict:
    """
    전체 피부 분석 결과를 종합한다.

    Args:
        class_results: 분류 결과 {metric: {"grade": int, ...}}
        regression_results: 회귀 결과 {metric: {"value": float, ...}}

    Returns:
        {
            "skin_type": str,
            "concerns": [{"concern": str, "level": str, "effects_needed": list}],
            "recommended_effects": list[str],
            "is_sensitive": bool
        }
    """
    concerns = []
    all_effects = set()

    # 분류 결과 평가
    for metric, result in class_results.items():
        grade = result.get("grade", 0)
        evaluation = evaluate_concern_level_classification(metric, grade)
        if evaluation["level"] != "양호":
            concerns.append(evaluation)
            all_effects.update(evaluation["effects_needed"])

    # 회귀 결과 평가
    moisture_values = []
    for metric, result in regression_results.items():
        value = result.get("value", 0)
        if metric == "moisture":
            moisture_values.append(value)
        evaluation = evaluate_concern_level_regression(metric, value)
        if evaluation["level"] != "양호":
            concerns.append(evaluation)
            all_effects.update(evaluation["effects_needed"])

    # 피부타입 판단
    skin_type = classify_skin_type(moisture_values)

    # 민감성 판단
    mapping = load_skin_type_mapping()
    sensitivity = mapping["sensitivity_indicators"]["conditions"]
    dryness_grade = class_results.get("dryness", {}).get("grade", 0)
    severe_count = sum(1 for c in concerns if c["level"] == "심각")
    is_sensitive = (
        dryness_grade >= sensitivity["dryness_grade_gte"]
        and severe_count >= sensitivity["severe_concern_count_gte"]
    )

    # 우선순위 정렬
    priority = mapping["concern_priority_order"]
    concerns.sort(key=lambda c: priority.index(c["concern"]) if c["concern"] in priority else 99)

    return {
        "skin_type": skin_type,
        "concerns": concerns,
        "recommended_effects": sorted(all_effects),
        "is_sensitive": is_sensitive,
    }


# ---------------------------------------------------------------------------
# Product search
# ---------------------------------------------------------------------------

def search_products(
    effects: Optional[list[str]] = None,
    skin_types: Optional[list[str]] = None,
    concerns: Optional[list[str]] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    price_range: Optional[str] = None,
    limit: int = 10,
) -> list[dict]:
    """
    조건에 맞는 화장품을 검색한다.

    Args:
        effects: 필요한 효능 리스트
        skin_types: 적합한 피부타입 리스트
        concerns: 피부 고민 리스트
        category: 제품 카테고리
        brand: 브랜드명
        price_range: 가격대
        limit: 최대 반환 개수

    Returns:
        매칭 점수 순으로 정렬된 제품 리스트
    """
    products = load_cosmetics()
    if not products:
        return []

    scored = []
    for product in products:
        score = 0

        # 효능 매칭
        if effects:
            matched = set(effects) & set(product.get("effects", []))
            if not matched:
                continue
            score += len(matched) * 3

        # 피부타입 매칭
        if skin_types:
            p_types = set(product.get("suitable_skin_types", []))
            if "모든피부" in p_types:
                score += 1
            else:
                matched = set(skin_types) & p_types
                if matched:
                    score += len(matched) * 2
                else:
                    continue

        # 고민 매칭
        if concerns:
            matched = set(concerns) & set(product.get("suitable_concerns", []))
            score += len(matched) * 2

        # 카테고리 필터
        if category and product.get("category") != category:
            continue

        # 브랜드 필터
        if brand and product.get("brand") != brand:
            continue

        # 가격대 필터
        if price_range and product.get("price_range") != price_range:
            continue

        # 평점 보너스
        rating = product.get("rating", 0)
        score += rating * 0.5

        scored.append((score, product))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:limit]]


def recommend_products(
    class_results: dict,
    regression_results: dict,
    category: Optional[str] = None,
    limit: int = 5,
) -> dict:
    """
    피부 분석 결과에 기반한 화장품 추천.

    Args:
        class_results: 분류 결과
        regression_results: 회귀 결과
        category: 특정 카테고리 필터 (선택)
        limit: 추천 개수

    Returns:
        {"analysis": dict, "recommendations": list[dict]}
    """
    analysis = analyze_skin(class_results, regression_results)

    concern_names = [c["concern"] for c in analysis["concerns"]]

    skin_types = [analysis["skin_type"]]
    if analysis["is_sensitive"]:
        skin_types.append("민감성")

    recommendations = search_products(
        effects=analysis["recommended_effects"],
        skin_types=skin_types,
        concerns=concern_names,
        category=category,
        limit=limit,
    )

    return {
        "analysis": analysis,
        "recommendations": recommendations,
    }


def get_product_by_id(product_id: str) -> Optional[dict]:
    """제품 ID로 제품을 조회한다."""
    products = load_cosmetics()
    for product in products:
        if product.get("id") == product_id:
            return product
    return None


def get_products_by_category(category: str) -> list[dict]:
    """카테고리별 제품 리스트를 반환한다."""
    products = load_cosmetics()
    return [p for p in products if p.get("category") == category]


def get_brands() -> list[str]:
    """등록된 브랜드 리스트를 반환한다."""
    products = load_cosmetics()
    return sorted(set(p.get("brand", "") for p in products))


# ---------------------------------------------------------------------------
# Ingredient-effect matching
# ---------------------------------------------------------------------------

def get_recommended_ingredients(effects: list[str]) -> list[dict]:
    """
    필요한 효능에 맞는 성분을 추천한다.

    Args:
        effects: 필요한 효능 리스트 (예: ["보습", "미백"])

    Returns:
        추천 성분 리스트 (우선순위순)
    """
    mapping = load_ingredients_mapping()
    if not mapping:
        return []

    ingredients_db = mapping.get("ingredients", {})
    effect_to_ing = mapping.get("effect_to_ingredients", {})

    seen = set()
    result = []

    for effect in effects:
        ingredient_names = effect_to_ing.get(effect, [])
        for name in ingredient_names:
            if name in seen:
                continue
            seen.add(name)
            info = ingredients_db.get(name, {})
            result.append({
                "name": name,
                "name_en": info.get("name_en", ""),
                "effects": info.get("effects", []),
                "target_concerns": info.get("target_concerns", []),
                "strength": info.get("strength", "medium"),
                "caution": info.get("caution"),
            })

    return result


def get_ingredient_info(ingredient_name: str) -> Optional[dict]:
    """성분 정보를 조회한다."""
    mapping = load_ingredients_mapping()
    if not mapping:
        return None
    return mapping.get("ingredients", {}).get(ingredient_name)


def match_product_ingredients(product: dict) -> list[dict]:
    """
    제품의 성분을 분석하여 각 성분의 효능 정보를 반환한다.

    Args:
        product: 제품 딕셔너리

    Returns:
        성분별 효능 정보 리스트
    """
    mapping = load_ingredients_mapping()
    if not mapping:
        return []

    ingredients_db = mapping.get("ingredients", {})
    result = []

    for ingredient_name in product.get("ingredients", []):
        info = ingredients_db.get(ingredient_name)
        if info:
            result.append({
                "name": ingredient_name,
                "name_en": info.get("name_en", ""),
                "effects": info.get("effects", []),
                "strength": info.get("strength", "medium"),
                "caution": info.get("caution"),
            })

    return result


def check_ingredient_cautions(
    product: dict, skin_type: str
) -> list[str]:
    """
    제품 성분 중 해당 피부타입에 주의가 필요한 항목을 반환한다.

    Args:
        product: 제품 딕셔너리
        skin_type: 사용자 피부타입

    Returns:
        주의사항 메시지 리스트
    """
    mapping = load_ingredients_mapping()
    if not mapping:
        return []

    ingredients_db = mapping.get("ingredients", {})
    cautions = []

    for ingredient_name in product.get("ingredients", []):
        info = ingredients_db.get(ingredient_name)
        if not info or not info.get("caution"):
            continue

        suitable = info.get("suitable_skin_types", [])
        if "모든피부" not in suitable and skin_type not in suitable:
            cautions.append(
                f"{ingredient_name}: {info['caution']}"
            )

    return cautions
