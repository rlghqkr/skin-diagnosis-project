"""
Statistics utility functions for PES algorithm and change detection.

Provides: trimmed_mean, weighted_moving_average, Welch's t-test,
Cohen's d, Bonferroni-Holm correction, and seasonal adjustment.
"""

from __future__ import annotations

import math
from datetime import date, timedelta
from typing import Sequence

import numpy as np
from scipy import stats as sp_stats


# ---------------------------------------------------------------------------
# Trimmed Mean
# ---------------------------------------------------------------------------

def trimmed_mean(values: Sequence[float], proportion: float = 0.1) -> float:
    """Compute trimmed mean, cutting *proportion* from each tail."""
    arr = np.asarray(values, dtype=float)
    return float(sp_stats.trim_mean(arr, proportion))


# ---------------------------------------------------------------------------
# Weighted Moving Average (WMA)
# ---------------------------------------------------------------------------

def weighted_moving_average(
    scores: Sequence[float],
    dates: Sequence[date],
    window: int = 7,
    min_points: int = 3,
) -> list[float | None]:
    """
    Weighted moving average that handles missing dates.
    Weight = (window - days_ago) / window  (linear decay).
    Returns None for positions with fewer than *min_points* data points.
    """
    result: list[float | None] = []
    for t_idx, t_date in enumerate(dates):
        window_start = t_date - timedelta(days=window - 1)
        weighted_sum = 0.0
        weight_sum = 0.0
        count = 0
        for s_idx, s_date in enumerate(dates):
            if window_start <= s_date <= t_date:
                days_ago = (t_date - s_date).days
                w = (window - days_ago) / window
                weighted_sum += scores[s_idx] * w
                weight_sum += w
                count += 1
        if count < min_points or weight_sum == 0:
            result.append(None)
        else:
            result.append(weighted_sum / weight_sum)
    return result


def compute_ma(
    scores: Sequence[float],
    dates: Sequence[date],
    target_date: date,
    window: int = 7,
    min_points: int = 3,
) -> float | None:
    """Compute WMA at a single *target_date*."""
    window_start = target_date - timedelta(days=window - 1)
    weighted_sum = 0.0
    weight_sum = 0.0
    count = 0
    for score, d in zip(scores, dates):
        if window_start <= d <= target_date:
            days_ago = (target_date - d).days
            w = (window - days_ago) / window
            weighted_sum += score * w
            weight_sum += w
            count += 1
    if count < min_points or weight_sum == 0:
        return None
    return weighted_sum / weight_sum


# ---------------------------------------------------------------------------
# Welch's t-test
# ---------------------------------------------------------------------------

def welch_ttest(
    group_a: Sequence[float],
    group_b: Sequence[float],
    one_sided: bool = False,
) -> dict:
    """
    Welch's t-test comparing group_a vs group_b.
    Returns dict with t_stat, p_value (two-sided or one-sided).
    """
    a = np.asarray(group_a, dtype=float)
    b = np.asarray(group_b, dtype=float)
    t_stat, p_two = sp_stats.ttest_ind(a, b, equal_var=False)
    p_value = p_two / 2 if one_sided else p_two
    return {"t_stat": float(t_stat), "p_value": float(p_value)}


# ---------------------------------------------------------------------------
# Cohen's d
# ---------------------------------------------------------------------------

def cohens_d(
    group_a: Sequence[float],
    group_b: Sequence[float],
) -> float:
    """Compute Cohen's d effect size (pooled std)."""
    a = np.asarray(group_a, dtype=float)
    b = np.asarray(group_b, dtype=float)
    n_a, n_b = len(a), len(b)
    if n_a < 2 or n_b < 2:
        return 0.0
    var_a = float(np.var(a, ddof=1))
    var_b = float(np.var(b, ddof=1))
    pooled_std = math.sqrt(
        ((n_a - 1) * var_a + (n_b - 1) * var_b) / (n_a + n_b - 2)
    )
    if pooled_std == 0:
        return 0.0
    return float((np.mean(a) - np.mean(b)) / pooled_std)


def classify_effect_size(d: float) -> str:
    """Classify Cohen's d into negligible / small / medium / large."""
    ad = abs(d)
    if ad < 0.2:
        return "negligible"
    if ad < 0.5:
        return "small"
    if ad < 0.8:
        return "medium"
    return "large"


# ---------------------------------------------------------------------------
# Bonferroni-Holm correction for multiple comparisons
# ---------------------------------------------------------------------------

def bonferroni_holm(
    results: list[dict],
    alpha: float = 0.05,
) -> list[dict]:
    """
    Apply Bonferroni-Holm step-down correction in-place.
    Each dict must contain a 'p_value' key.
    Adds 'is_significant' and 'adjusted_alpha'.
    """
    sorted_results = sorted(results, key=lambda r: r["p_value"])
    m = len(sorted_results)
    for i, r in enumerate(sorted_results):
        adj_alpha = alpha / (m - i)
        r["is_significant"] = r["p_value"] < adj_alpha
        r["adjusted_alpha"] = adj_alpha
    return sorted_results


# ---------------------------------------------------------------------------
# Significance test pipeline (multi-metric)
# ---------------------------------------------------------------------------

def test_significance(
    before_scores: dict[str, list[float]],
    after_scores: dict[str, list[float]],
    metrics: list[str],
    alpha: float = 0.05,
) -> list[dict]:
    """
    Per-metric Welch's t-test + Cohen's d with Bonferroni-Holm correction.
    """
    results: list[dict] = []
    for metric in metrics:
        b = before_scores.get(metric, [])
        a = after_scores.get(metric, [])
        if len(a) < 3 or len(b) < 3:
            results.append({
                "metric": metric,
                "status": "insufficient_data",
                "is_significant": False,
            })
            continue
        tt = welch_ttest(a, b)
        d = cohens_d(a, b)
        results.append({
            "metric": metric,
            "t_stat": tt["t_stat"],
            "p_value": tt["p_value"],
            "cohens_d": d,
            "effect_size_label": classify_effect_size(d),
        })

    testable = [r for r in results if "p_value" in r]
    if testable:
        bonferroni_holm(testable, alpha)
    for r in results:
        r.setdefault("is_significant", False)
    return results


# ---------------------------------------------------------------------------
# Seasonal adjustment
# ---------------------------------------------------------------------------

SEASONAL_FACTORS: dict[str, dict[str, dict[int, float]]] = {
    "dry": {
        "hydration": {
            1: -0.08, 2: -0.06, 3: -0.02, 4: 0.01, 5: 0.04, 6: 0.06,
            7: 0.05, 8: 0.04, 9: 0.02, 10: -0.01, 11: -0.04, 12: -0.07,
        },
        "elasticity": {
            1: -0.03, 2: -0.02, 3: 0.0, 4: 0.01, 5: 0.02, 6: 0.03,
            7: 0.03, 8: 0.02, 9: 0.01, 10: 0.0, 11: -0.02, 12: -0.03,
        },
        "pore": {
            1: 0.02, 2: 0.01, 3: 0.0, 4: -0.01, 5: -0.03, 6: -0.04,
            7: -0.05, 8: -0.04, 9: -0.02, 10: 0.0, 11: 0.01, 12: 0.02,
        },
        "wrinkle": {
            1: -0.02, 2: -0.01, 3: 0.0, 4: 0.0, 5: 0.01, 6: 0.01,
            7: 0.01, 8: 0.01, 9: 0.0, 10: 0.0, 11: -0.01, 12: -0.02,
        },
        "pigmentation": {
            1: 0.02, 2: 0.01, 3: 0.0, 4: -0.01, 5: -0.03, 6: -0.04,
            7: -0.04, 8: -0.03, 9: -0.01, 10: 0.01, 11: 0.02, 12: 0.02,
        },
    },
    "oily": {
        "hydration": {
            1: -0.04, 2: -0.03, 3: -0.01, 4: 0.01, 5: 0.02, 6: 0.03,
            7: 0.03, 8: 0.02, 9: 0.01, 10: 0.0, 11: -0.02, 12: -0.03,
        },
        "elasticity": {
            1: -0.02, 2: -0.01, 3: 0.0, 4: 0.01, 5: 0.01, 6: 0.02,
            7: 0.02, 8: 0.01, 9: 0.01, 10: 0.0, 11: -0.01, 12: -0.02,
        },
        "pore": {
            1: 0.03, 2: 0.02, 3: 0.01, 4: -0.02, 5: -0.04, 6: -0.06,
            7: -0.06, 8: -0.05, 9: -0.03, 10: 0.0, 11: 0.02, 12: 0.03,
        },
        "wrinkle": {
            1: -0.01, 2: -0.01, 3: 0.0, 4: 0.0, 5: 0.01, 6: 0.01,
            7: 0.01, 8: 0.01, 9: 0.0, 10: 0.0, 11: -0.01, 12: -0.01,
        },
        "pigmentation": {
            1: 0.01, 2: 0.01, 3: 0.0, 4: -0.01, 5: -0.02, 6: -0.03,
            7: -0.03, 8: -0.02, 9: -0.01, 10: 0.0, 11: 0.01, 12: 0.01,
        },
    },
    "combination": {
        "hydration": {
            1: -0.06, 2: -0.04, 3: -0.01, 4: 0.01, 5: 0.03, 6: 0.04,
            7: 0.04, 8: 0.03, 9: 0.01, 10: -0.01, 11: -0.03, 12: -0.05,
        },
        "elasticity": {
            1: -0.02, 2: -0.01, 3: 0.0, 4: 0.01, 5: 0.02, 6: 0.02,
            7: 0.02, 8: 0.02, 9: 0.01, 10: 0.0, 11: -0.01, 12: -0.02,
        },
        "pore": {
            1: 0.02, 2: 0.01, 3: 0.0, 4: -0.01, 5: -0.03, 6: -0.05,
            7: -0.05, 8: -0.04, 9: -0.02, 10: 0.0, 11: 0.01, 12: 0.02,
        },
        "wrinkle": {
            1: -0.02, 2: -0.01, 3: 0.0, 4: 0.0, 5: 0.01, 6: 0.01,
            7: 0.01, 8: 0.01, 9: 0.0, 10: 0.0, 11: -0.01, 12: -0.02,
        },
        "pigmentation": {
            1: 0.02, 2: 0.01, 3: 0.0, 4: -0.01, 5: -0.02, 6: -0.03,
            7: -0.03, 8: -0.02, 9: -0.01, 10: 0.0, 11: 0.01, 12: 0.02,
        },
    },
    "sensitive": {
        "hydration": {
            1: -0.07, 2: -0.05, 3: -0.02, 4: 0.01, 5: 0.03, 6: 0.05,
            7: 0.05, 8: 0.04, 9: 0.02, 10: -0.01, 11: -0.03, 12: -0.06,
        },
        "elasticity": {
            1: -0.03, 2: -0.02, 3: 0.0, 4: 0.01, 5: 0.02, 6: 0.03,
            7: 0.03, 8: 0.02, 9: 0.01, 10: 0.0, 11: -0.02, 12: -0.03,
        },
        "pore": {
            1: 0.02, 2: 0.01, 3: 0.0, 4: -0.01, 5: -0.02, 6: -0.04,
            7: -0.04, 8: -0.03, 9: -0.02, 10: 0.0, 11: 0.01, 12: 0.02,
        },
        "wrinkle": {
            1: -0.02, 2: -0.01, 3: 0.0, 4: 0.0, 5: 0.01, 6: 0.01,
            7: 0.01, 8: 0.01, 9: 0.0, 10: 0.0, 11: -0.01, 12: -0.02,
        },
        "pigmentation": {
            1: 0.02, 2: 0.01, 3: 0.0, 4: -0.01, 5: -0.03, 6: -0.04,
            7: -0.04, 8: -0.03, 9: -0.01, 10: 0.01, 11: 0.02, 12: 0.02,
        },
    },
    "normal": {
        "hydration": {
            1: -0.04, 2: -0.03, 3: -0.01, 4: 0.01, 5: 0.02, 6: 0.03,
            7: 0.03, 8: 0.02, 9: 0.01, 10: 0.0, 11: -0.02, 12: -0.03,
        },
        "elasticity": {
            1: -0.02, 2: -0.01, 3: 0.0, 4: 0.01, 5: 0.01, 6: 0.02,
            7: 0.02, 8: 0.01, 9: 0.01, 10: 0.0, 11: -0.01, 12: -0.02,
        },
        "pore": {
            1: 0.01, 2: 0.01, 3: 0.0, 4: -0.01, 5: -0.02, 6: -0.03,
            7: -0.03, 8: -0.02, 9: -0.01, 10: 0.0, 11: 0.01, 12: 0.01,
        },
        "wrinkle": {
            1: -0.01, 2: -0.01, 3: 0.0, 4: 0.0, 5: 0.01, 6: 0.01,
            7: 0.01, 8: 0.0, 9: 0.0, 10: 0.0, 11: -0.01, 12: -0.01,
        },
        "pigmentation": {
            1: 0.01, 2: 0.01, 3: 0.0, 4: -0.01, 5: -0.02, 6: -0.02,
            7: -0.02, 8: -0.02, 9: -0.01, 10: 0.0, 11: 0.01, 12: 0.01,
        },
    },
}


def get_seasonal_factor(
    skin_type: str | None,
    metric: str,
    month: int,
) -> float:
    """Look up seasonal adjustment factor for the given skin type / metric / month."""
    key = skin_type or "normal"
    metric_key = metric.replace("_norm", "")
    return SEASONAL_FACTORS.get(key, {}).get(metric_key, {}).get(month, 0.0)


def remove_seasonal_effect(
    score: float,
    metric: str,
    month: int,
    skin_type: str | None,
) -> float:
    """Return score with seasonal component removed."""
    return score - get_seasonal_factor(skin_type, metric, month)


# ---------------------------------------------------------------------------
# Ingredient-effect mapping (domain knowledge)
# ---------------------------------------------------------------------------

INGREDIENT_EFFECT_MAP: dict[str, dict[str, float]] = {
    "Niacinamide":     {"pigmentation": 0.8, "pore": 0.6, "hydration": 0.3},
    "Retinol":         {"wrinkle": 0.9, "elasticity": 0.7, "pigmentation": 0.4},
    "Hyaluronic Acid": {"hydration": 0.9, "elasticity": 0.3},
    "Salicylic Acid":  {"pore": 0.8, "wrinkle": 0.2},
    "Vitamin C":       {"pigmentation": 0.9, "elasticity": 0.4},
    "Ceramide":        {"hydration": 0.8, "elasticity": 0.5},
    "AHA":             {"pore": 0.7, "pigmentation": 0.5, "wrinkle": 0.3},
    "Peptide":         {"wrinkle": 0.8, "elasticity": 0.7},
    "Green Tea Seed Oil": {"hydration": 0.5},
    "Glycolic Acid":   {"pore": 0.7, "pigmentation": 0.5, "wrinkle": 0.3},
}


# Buffer days per active ingredient
BUFFER_DAYS: dict[str, int] = {
    "Retinol": 14,
    "AHA": 7,
    "BHA": 7,
    "Salicylic Acid": 7,
    "Glycolic Acid": 7,
    "Vitamin C": 3,
}

# Expected effect lag per product category (days)
EXPECTED_EFFECT_LAG: dict[str, int] = {
    "cleanser": 5, "toner": 10, "serum": 21,
    "essence": 17, "ampoule": 14, "cream": 21,
    "eye_cream": 28, "sunscreen": 10, "mask": 2, "other": 14,
}


def get_buffer_days(key_ingredients: list[dict] | None) -> int:
    """Determine buffer (adaptation) days from product ingredients."""
    if not key_ingredients:
        return 0
    max_buf = 0
    for ing in key_ingredients:
        name_en = ing.get("name_en", "")
        for keyword, buf in BUFFER_DAYS.items():
            if keyword.lower() in name_en.lower():
                max_buf = max(max_buf, buf)
    return max_buf


# ---------------------------------------------------------------------------
# Concern ↔ metric mapping
# ---------------------------------------------------------------------------

CONCERN_TO_METRIC: dict[str, str] = {
    "dryness": "hydration",
    "sagging": "elasticity",
    "pore": "pore",
    "wrinkle": "wrinkle",
    "pigmentation": "pigmentation",
}

METRIC_LABELS: dict[str, str] = {
    "hydration_norm": "수분",
    "elasticity_norm": "탄력",
    "pore_norm": "모공",
    "wrinkle_norm": "주름",
    "pigmentation_norm": "색소침착",
    "overall": "종합 피부 점수",
}

DEFAULT_METRIC_WEIGHTS: dict[str, float] = {
    "hydration": 0.25,
    "elasticity": 0.20,
    "pore": 0.20,
    "wrinkle": 0.20,
    "pigmentation": 0.15,
}

EPSILON = 0.01
