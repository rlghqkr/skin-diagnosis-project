"""
NIA 피부 종합 점수 계산

분류(등급) + 회귀(수치) 결과를 종합하여 0-100 피부 건강 점수 산출.
"""

from __future__ import annotations

from dataclasses import dataclass

from tool.schemas import CategoryScore, SkinScore


# ---------------------------------------------------------------------------
# 분류 등급 → 점수 변환 (낮은 등급 = 좋은 상태 = 높은 점수)
# ---------------------------------------------------------------------------
# max_grade: 각 메트릭의 최대 등급 (exclusive of num_classes)
_CLASS_MAX_GRADE = {
    "dryness": 4,       # 0-4
    "pigmentation": 5,  # 0-5
    "pore": 5,          # 0-5
    "sagging": 5,       # 0-5
    "wrinkle": 6,       # 0-6
}

# 회귀 메트릭 범위 & 방향 (higher_is_better)
_REGRESSION_RANGES: dict[str, tuple[float, float, bool]] = {
    # (min, max, higher_is_better)
    "pigmentation": (0, 350, True),     # ITA° — 높을수록 밝은 피부
    "moisture": (0, 100, True),         # % — 높을수록 수분 많음
    "elasticity_R2": (0, 1, True),      # R2 — 높을수록 탄력 좋음
    "wrinkle_Ra": (0, 50, False),       # Ra — 낮을수록 주름 적음
    "pore": (0, 2600, False),           # count — 낮을수록 모공 적음
}

# 카테고리 매핑: 카테고리명 → (포함될 분류 메트릭, 포함될 회귀 메트릭)
_CATEGORY_MAP: dict[str, tuple[list[str], list[str]]] = {
    "수분": (["dryness"], ["moisture"]),
    "탄력": (["sagging"], ["elasticity_R2"]),
    "색소": (["pigmentation"], ["pigmentation"]),
    "모공": (["pore"], ["pore"]),
    "주름": (["wrinkle"], ["wrinkle_Ra"]),
}

# 종합 점수 가중치 (카테고리별)
_CATEGORY_WEIGHTS = {
    "수분": 0.20,
    "탄력": 0.20,
    "색소": 0.20,
    "모공": 0.20,
    "주름": 0.20,
}


def _score_label(score: float) -> str:
    """점수를 상태 라벨로 변환."""
    if score >= 80:
        return "좋음"
    if score >= 60:
        return "보통"
    if score >= 40:
        return "주의"
    return "나쁨"


@dataclass
class _Scores:
    classification: dict[str, float]  # metric → 0-100
    regression: dict[str, float]      # metric → 0-100


class SkinScoreCalculator:
    """분류 등급 + 회귀 수치를 종합 점수로 변환."""

    def _grade_to_score(self, metric: str, regions: dict) -> float:
        """여러 region의 등급 평균을 100점 척도로 변환."""
        max_grade = _CLASS_MAX_GRADE.get(metric)
        if max_grade is None or not regions:
            return -1
        grades = [r["grade"] for r in regions.values() if "grade" in r]
        if not grades:
            return -1
        avg_grade = sum(grades) / len(grades)
        # 낮은 등급 = 좋은 상태 → 높은 점수
        return round((1 - avg_grade / max_grade) * 100, 1)

    def _regression_to_score(self, metric: str, regions: dict) -> float:
        """여러 region의 회귀값 평균을 100점 척도로 변환."""
        cfg = _REGRESSION_RANGES.get(metric)
        if cfg is None or not regions:
            return -1
        vals = [r["value"] for r in regions.values() if "value" in r]
        if not vals:
            return -1
        avg_val = sum(vals) / len(vals)
        lo, hi, higher_better = cfg
        # 범위 클리핑 후 정규화
        clamped = max(lo, min(hi, avg_val))
        normalized = (clamped - lo) / (hi - lo) if hi > lo else 0
        score = normalized if higher_better else (1 - normalized)
        return round(score * 100, 1)

    def calculate(
        self,
        classification: dict[str, dict],
        regression: dict[str, dict],
    ) -> SkinScore:
        """
        Parameters
        ----------
        classification : 분류 예측 결과 — {metric: {region: {grade, probabilities}}}
        regression     : 회귀 예측 결과 — {metric: {region: {value}}}

        Returns
        -------
        SkinScore 종합 점수 + 카테고리별 점수
        """
        cls_scores = {
            m: self._grade_to_score(m, regions)
            for m, regions in classification.items()
        }
        reg_scores = {
            m: self._regression_to_score(m, regions)
            for m, regions in regression.items()
        }

        categories: list[CategoryScore] = []
        weighted_sum = 0.0
        weight_sum = 0.0

        for cat_name, (cls_metrics, reg_metrics) in _CATEGORY_MAP.items():
            scores = []
            for m in cls_metrics:
                s = cls_scores.get(m, -1)
                if s >= 0:
                    scores.append(s)
            for m in reg_metrics:
                s = reg_scores.get(m, -1)
                if s >= 0:
                    scores.append(s)

            if scores:
                cat_score = round(sum(scores) / len(scores), 1)
            else:
                cat_score = 50.0  # 데이터 없으면 중간값

            categories.append(
                CategoryScore(
                    category=cat_name,
                    score=cat_score,
                    label=_score_label(cat_score),
                )
            )

            w = _CATEGORY_WEIGHTS[cat_name]
            weighted_sum += cat_score * w
            weight_sum += w

        overall = round(weighted_sum / weight_sum, 1) if weight_sum > 0 else 50.0

        return SkinScore(overall=overall, categories=categories)
