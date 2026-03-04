"""
NIA 화장품 추천 엔진

피부 측정값(분류 등급 + 회귀 수치)을 기반으로 피부 타입 결정,
피부 고민 우선순위 매핑, 고민별 성분/제품 추천.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from tool.schemas import (
    ConcernRecommendation,
    CosmeticProduct,
    Ingredient,
    RecommendResponse,
    SkinConcern,
    SkinType,
)

logger = logging.getLogger("recommendation")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# ---------------------------------------------------------------------------
# 분류 등급 심각도 임계값 (등급 / 최대등급 비율)
# ---------------------------------------------------------------------------
_SEVERITY_THRESHOLDS = {
    "low": 0.33,
    "moderate": 0.66,
    # >= 0.66 → high
}

_CLASS_MAX_GRADE = {
    "dryness": 4,
    "pigmentation": 5,
    "pore": 5,
    "sagging": 5,
    "wrinkle": 6,
}

# 분류 메트릭 → 피부 고민
_METRIC_TO_CONCERN: dict[str, SkinConcern] = {
    "dryness": SkinConcern.DRYNESS,
    "pigmentation": SkinConcern.PIGMENTATION,
    "pore": SkinConcern.PORE,
    "sagging": SkinConcern.SAGGING,
    "wrinkle": SkinConcern.WRINKLE,
}

# SkinType enum → 화장품 DB 한국어 라벨 매핑
_SKIN_TYPE_KO: dict[SkinType, str] = {
    SkinType.DRY: "건성",
    SkinType.OILY: "지성",
    SkinType.COMBINATION: "복합성",
    SkinType.SENSITIVE: "민감성",
}

# SkinConcern enum → 화장품 DB 한국어 고민 라벨 매핑
_CONCERN_KO: dict[SkinConcern, str] = {
    SkinConcern.DRYNESS: "건조",
    SkinConcern.PIGMENTATION: "색소침착",
    SkinConcern.PORE: "모공",
    SkinConcern.SAGGING: "탄력저하",
    SkinConcern.WRINKLE: "주름",
}

# 기본 피부 고민별 추천 성분 (data-eng 매핑이 없을 때 폴백)
_DEFAULT_INGREDIENTS: dict[SkinConcern, list[dict[str, str]]] = {
    SkinConcern.DRYNESS: [
        {"name_ko": "히알루론산", "name_en": "Hyaluronic Acid", "benefit": "수분 보유력 강화"},
        {"name_ko": "세라마이드", "name_en": "Ceramide", "benefit": "피부 장벽 강화"},
        {"name_ko": "글리세린", "name_en": "Glycerin", "benefit": "보습"},
    ],
    SkinConcern.PIGMENTATION: [
        {"name_ko": "나이아신아마이드", "name_en": "Niacinamide", "benefit": "멜라닌 생성 억제"},
        {"name_ko": "비타민C", "name_en": "Vitamin C", "benefit": "미백 및 항산화"},
        {"name_ko": "알부틴", "name_en": "Arbutin", "benefit": "색소침착 완화"},
    ],
    SkinConcern.PORE: [
        {"name_ko": "살리실산", "name_en": "Salicylic Acid", "benefit": "모공 속 각질 제거"},
        {"name_ko": "나이아신아마이드", "name_en": "Niacinamide", "benefit": "피지 조절 및 모공 축소"},
        {"name_ko": "레티놀", "name_en": "Retinol", "benefit": "세포 재생 촉진"},
    ],
    SkinConcern.SAGGING: [
        {"name_ko": "레티놀", "name_en": "Retinol", "benefit": "콜라겐 생성 촉진"},
        {"name_ko": "펩타이드", "name_en": "Peptide", "benefit": "피부 탄력 개선"},
        {"name_ko": "아데노신", "name_en": "Adenosine", "benefit": "주름 개선 및 탄력"},
    ],
    SkinConcern.WRINKLE: [
        {"name_ko": "레티놀", "name_en": "Retinol", "benefit": "주름 개선"},
        {"name_ko": "아데노신", "name_en": "Adenosine", "benefit": "주름 완화"},
        {"name_ko": "콜라겐", "name_en": "Collagen", "benefit": "피부 탄력 및 보습"},
    ],
}


def _load_json(path: Path) -> Any:
    """JSON 파일 로드. 파일이 없으면 None 반환."""
    if not path.exists():
        logger.warning("Data file not found: %s", path)
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


class RecommendationEngine:
    """피부 측정 결과를 기반으로 화장품 추천."""

    def __init__(self) -> None:
        self._cosmetics: list[dict] | None = None
        self._skin_type_mapping: dict | None = None
        self._ingredients_mapping: dict | None = None

    def load_data(self) -> None:
        """data/ 디렉토리에서 JSON 데이터 로드."""
        cosmetics_raw = _load_json(DATA_DIR / "cosmetics.json")
        # cosmetics.json wraps products in {"products": [...]}
        if isinstance(cosmetics_raw, dict) and "products" in cosmetics_raw:
            self._cosmetics = cosmetics_raw["products"]
        elif isinstance(cosmetics_raw, list):
            self._cosmetics = cosmetics_raw
        else:
            self._cosmetics = None
        self._skin_type_mapping = _load_json(DATA_DIR / "skin_type_mapping.json")
        self._ingredients_mapping = _load_json(DATA_DIR / "ingredients_mapping.json")

    # ------------------------------------------------------------------
    # 피부 타입 결정
    # ------------------------------------------------------------------
    def determine_skin_type(
        self,
        classification: dict[str, dict],
        regression: dict[str, dict],
    ) -> SkinType:
        """분류/회귀 결과에서 피부 타입 결정."""
        # 외부 매핑이 있으면 사용
        if self._skin_type_mapping:
            return self._determine_from_mapping(classification, regression)
        return self._determine_heuristic(classification, regression)

    def _determine_from_mapping(
        self,
        classification: dict[str, dict],
        regression: dict[str, dict],
    ) -> SkinType:
        """skin_type_mapping.json 기반 피부 타입 결정."""
        mapping = self._skin_type_mapping
        if not mapping:
            return self._determine_heuristic(classification, regression)

        # 민감성 판단: 건조도 심각 + 다수 고민 심각
        sensitivity = mapping.get("sensitivity_indicators", {}).get("conditions", {})
        if sensitivity:
            dryness_threshold = sensitivity.get("dryness_grade_gte", 99)
            severe_count_threshold = sensitivity.get("severe_concern_count_gte", 99)
            dryness_grade = self._avg_grade("dryness", classification)
            if dryness_grade is not None and dryness_grade >= dryness_threshold:
                severe_count = self._count_severe_concerns(classification, mapping)
                if severe_count >= severe_count_threshold:
                    return SkinType.SENSITIVE

        # 수분 기반 피부 타입 (skin_type_classification.moisture)
        skin_type_cls = mapping.get("skin_type_classification", {})
        moisture_ranges = skin_type_cls.get("moisture", {})
        combination_rule = skin_type_cls.get("combination_rule", {})

        moisture_values = self._all_regression_values("moisture", regression)
        moisture_avg = (
            sum(moisture_values) / len(moisture_values) if moisture_values else None
        )

        # 복합성 체크: 부위별 수분 편차가 threshold 이상
        if moisture_values and len(moisture_values) > 1:
            variance = max(moisture_values) - min(moisture_values)
            threshold = combination_rule.get("threshold", 20)
            if variance >= threshold:
                return SkinType.COMBINATION

        # 수분값으로 건성/중성/지성 판단
        _KO_TO_SKIN_TYPE = {"건성": SkinType.DRY, "중성": SkinType.COMBINATION, "지성": SkinType.OILY}
        if moisture_avg is not None:
            for ko_label, range_info in moisture_ranges.items():
                if isinstance(range_info, dict) and "min" in range_info:
                    lo = range_info["min"]
                    hi = range_info["max"]
                    if lo <= moisture_avg <= hi:
                        return _KO_TO_SKIN_TYPE.get(ko_label, SkinType.COMBINATION)

        return self._determine_heuristic(classification, regression)

    def _count_severe_concerns(
        self,
        classification: dict[str, dict],
        mapping: dict,
    ) -> int:
        """매핑 기반으로 '심각' 수준 고민 개수 카운트."""
        grade_mapping = mapping.get("classification_grade_mapping", {})
        count = 0
        for metric, cfg in grade_mapping.items():
            severe_grades = set(cfg.get("levels", {}).get("심각", []))
            if not severe_grades:
                continue
            regions = classification.get(metric, {})
            for region_data in regions.values():
                if region_data.get("grade") in severe_grades:
                    count += 1
                    break  # 한 메트릭에서 하나라도 심각이면 카운트
        return count

    def _determine_heuristic(
        self,
        classification: dict[str, dict],
        regression: dict[str, dict],
    ) -> SkinType:
        """휴리스틱 기반 피부 타입 결정."""
        moisture = self._avg_regression("moisture", regression)
        dryness_grade = self._avg_grade("dryness", classification)

        # 건조 등급이 높고 수분이 낮으면 건성
        if dryness_grade is not None and dryness_grade >= 3:
            return SkinType.DRY
        if moisture is not None and moisture < 30:
            return SkinType.DRY

        # 수분이 매우 높으면 지성
        if moisture is not None and moisture > 70:
            return SkinType.OILY

        # 중간이면 복합성
        return SkinType.COMBINATION

    # ------------------------------------------------------------------
    # 피부 고민 우선순위
    # ------------------------------------------------------------------
    def prioritize_concerns(
        self,
        classification: dict[str, dict],
    ) -> list[tuple[SkinConcern, float, str]]:
        """
        분류 등급 기반 피부 고민 우선순위.

        Returns: [(concern, severity_ratio, severity_label), ...] 심각도 내림차순
        """
        concerns: list[tuple[SkinConcern, float, str]] = []

        for metric, concern in _METRIC_TO_CONCERN.items():
            regions = classification.get(metric, {})
            if not regions:
                continue
            max_grade = _CLASS_MAX_GRADE[metric]
            grades = [r["grade"] for r in regions.values() if "grade" in r]
            if not grades:
                continue
            avg_grade = sum(grades) / len(grades)
            ratio = avg_grade / max_grade

            if ratio < _SEVERITY_THRESHOLDS["low"]:
                severity = "low"
            elif ratio < _SEVERITY_THRESHOLDS["moderate"]:
                severity = "moderate"
            else:
                severity = "high"

            concerns.append((concern, ratio, severity))

        # 심각도 높은 순으로 정렬
        concerns.sort(key=lambda x: x[1], reverse=True)
        return concerns

    # ------------------------------------------------------------------
    # 성분 추천
    # ------------------------------------------------------------------
    def get_ingredients(self, concern: SkinConcern) -> list[Ingredient]:
        """피부 고민별 추천 성분 조회."""
        # 외부 매핑 우선
        if self._ingredients_mapping:
            mapped = self._ingredients_mapping.get(concern.value, [])
            if mapped:
                return [Ingredient(**item) for item in mapped]

        # 기본 폴백
        defaults = _DEFAULT_INGREDIENTS.get(concern, [])
        return [Ingredient(**item) for item in defaults]

    # ------------------------------------------------------------------
    # 제품 추천
    # ------------------------------------------------------------------
    def find_products(
        self,
        concern: SkinConcern,
        skin_type: SkinType,
        max_results: int = 5,
    ) -> list[CosmeticProduct]:
        """피부 고민 + 피부 타입에 맞는 제품 검색."""
        if not self._cosmetics:
            return []

        ingredients = self.get_ingredients(concern)
        ingredient_names = {
            ing.name_ko for ing in ingredients
        } | {
            ing.name_en for ing in ingredients if ing.name_en
        }

        concern_ko = _CONCERN_KO.get(concern, concern.value)
        skin_type_ko = _SKIN_TYPE_KO.get(skin_type, skin_type.value)

        scored: list[tuple[dict, float, list[str]]] = []

        for product in self._cosmetics:
            score = 0.0
            reasons: list[str] = []

            # 성분 매칭 (schema field: "ingredients")
            product_ingredients = set(product.get("ingredients", []))
            matched = ingredient_names & product_ingredients
            if matched:
                score += len(matched) * 20
                reasons.append(f"핵심 성분 포함: {', '.join(matched)}")

            # 피부 타입 적합성 (schema field: "suitable_skin_types", Korean labels)
            suitable_types = product.get("suitable_skin_types", [])
            if "모든피부" in suitable_types or skin_type_ko in suitable_types:
                score += 15
                reasons.append(f"{skin_type_ko} 피부에 적합")

            # 고민 카테고리 매칭 (schema field: "suitable_concerns", Korean labels)
            product_concerns = product.get("suitable_concerns", [])
            if concern_ko in product_concerns:
                score += 25
                reasons.append(f"{concern_ko} 고민 타겟 제품")

            # 평점 보너스
            rating = product.get("rating")
            if rating is not None and rating >= 4.0:
                score += 5
                reasons.append(f"높은 평점 ({rating})")

            if score > 0:
                scored.append((product, min(score, 100), reasons))

        # 점수 내림차순 정렬
        scored.sort(key=lambda x: x[1], reverse=True)

        results = []
        for product, score, reasons in scored[:max_results]:
            results.append(
                CosmeticProduct(
                    id=product.get("id", ""),
                    name=product.get("name", ""),
                    brand=product.get("brand", ""),
                    category=product.get("category", ""),
                    image_url=product.get("image_url"),
                    price=product.get("price"),
                    key_ingredients=product.get("ingredients", []),
                    match_score=score,
                    match_reasons=reasons,
                )
            )
        return results

    # ------------------------------------------------------------------
    # 통합 추천
    # ------------------------------------------------------------------
    def recommend(
        self,
        classification: dict[str, dict],
        regression: dict[str, dict],
        max_concerns: int = 3,
        max_products_per_concern: int = 5,
    ) -> RecommendResponse:
        """
        분류/회귀 예측 결과를 받아 종합 추천 생성.

        Parameters
        ----------
        classification : {metric: {region: {grade, probabilities}}}
        regression     : {metric: {region: {value}}}
        """
        skin_type = self.determine_skin_type(classification, regression)
        ranked_concerns = self.prioritize_concerns(classification)

        # 상위 N개 고민만
        top_concerns = ranked_concerns[:max_concerns]
        primary = [c[0] for c in top_concerns]

        recommendations: list[ConcernRecommendation] = []
        for concern, _ratio, severity in top_concerns:
            ingredients = self.get_ingredients(concern)
            products = self.find_products(concern, skin_type, max_products_per_concern)
            recommendations.append(
                ConcernRecommendation(
                    concern=concern,
                    severity=severity,
                    recommended_ingredients=ingredients,
                    products=products,
                )
            )

        return RecommendResponse(
            skin_type=skin_type,
            primary_concerns=primary,
            recommendations=recommendations,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _avg_grade(metric: str, classification: dict[str, dict]) -> float | None:
        regions = classification.get(metric, {})
        grades = [r["grade"] for r in regions.values() if "grade" in r]
        return sum(grades) / len(grades) if grades else None

    @staticmethod
    def _avg_regression(metric: str, regression: dict[str, dict]) -> float | None:
        regions = regression.get(metric, {})
        vals = [r["value"] for r in regions.values() if "value" in r]
        return sum(vals) / len(vals) if vals else None

    @staticmethod
    def _all_regression_values(metric: str, regression: dict[str, dict]) -> list[float]:
        regions = regression.get(metric, {})
        return [r["value"] for r in regions.values() if "value" in r]
