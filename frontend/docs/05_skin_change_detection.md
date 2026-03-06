# 05. Skin Change Detection Logic - 피부 변화 감지 로직

## 1. 개요 (Overview)

### 1.1 목적

피부 변화 감지 로직은 사용자의 일일 피부 점수 시계열 데이터를 실시간으로 모니터링하여, **피부 개선**, **피부 악화**, 그리고 **제품 영향 가능성**을 자동으로 감지하고 사용자에게 적시에 알려주는 시스템이다.

### 1.2 핵심 감지 대상

| 감지 유형 | 설명 | 긴급도 |
|---|---|---|
| **피부 개선 감지** | 피부 상태가 유의미하게 좋아지고 있음 | 낮음 (긍정적 알림) |
| **피부 악화 감지** | 피부 상태가 나빠지고 있으며 조기 대응 필요 | 높음 (경고 알림) |
| **제품 영향 감지** | 특정 제품 변경과 피부 변화 간의 연관성 | 중간 (정보 알림) |
| **이상치 감지** | 일시적이고 비정상적인 피부 점수 변동 | 낮음 (기록용) |

### 1.3 데이터 소스 (Data Model 참조)

| 테이블 | 용도 | 핵심 필드 |
|---|---|---|
| `daily_skin_scores` | 일일 피부 점수 시계열 | `overall_score`, `*_norm`, `ma_7_score`, `trend_direction`, `trend_velocity`, `is_anomaly` |
| `product_usage_history` | 제품 변경 이벤트 추적 | `start_date`, `end_date`, `is_active` |
| `skincare_routines` | 루틴 변경 추적 | `routine_date`, `steps` |
| `product_effect_analyses` | 기존 효과 분석 결과 참조 | `effect_score`, `confidence_level` |
| `users` | 사용자 피부 유형, 알림 설정 | `skin_type`, `notification_enabled` |

### 1.4 알고리즘 참조

본 문서는 `04_product_effect_algorithm.md`의 다음 개념을 활용한다:
- Baseline Estimation (Section 2)
- Moving Average (Section 4)
- External Noise Removal (Section 5)
- Statistical Significance Testing (Section 7)

---

## 2. 피부 개선 감지 알고리즘 (Skin Improvement Detection)

### 2.1 감지 전략: Threshold + Statistical Hybrid

단순 threshold 기반 감지는 빠르지만 오탐(false positive)이 많고, 순수 통계적 방법은 정확하지만 느리다. 두 방법을 결합하여 **빠르면서도 정확한** 감지를 달성한다.

```
                    ┌────────────────────┐
                    │   Daily Score      │
                    │   Input Stream     │
                    └────────┬───────────┘
                             │
                    ┌────────┴───────────┐
                    │  Stage 1:          │
                    │  Threshold Screen  │─── 빠른 후보 선별 (ms 단위)
                    └────────┬───────────┘
                             │ (후보 통과)
                    ┌────────┴───────────┐
                    │  Stage 2:          │
                    │  Statistical       │─── 정밀 검증 (초 단위)
                    │  Confirmation      │
                    └────────┬───────────┘
                             │ (검증 통과)
                    ┌────────┴───────────┐
                    │  Stage 3:          │
                    │  Contextual        │─── 맥락 분석
                    │  Analysis          │
                    └────────┬───────────┘
                             │
                    ┌────────┴───────────┐
                    │  Alert Generation  │
                    └────────────────────┘
```

### 2.2 Stage 1: Threshold-Based Screening (임계값 기반 선별)

#### 2.2.1 절대 개선 감지 (Absolute Improvement)

$$\text{MA}_7(t) - \text{MA}_7(t - 7) > \theta_{abs}^{improve}$$

- $\theta_{abs}^{improve} = 3.0$ (7일 이동 평균이 전주 대비 3점 이상 상승)

#### 2.2.2 상대 개선 감지 (Relative Improvement)

$$\frac{\text{MA}_7(t) - \text{MA}_7(t - 7)}{\text{MA}_7(t - 7) + \epsilon} > \theta_{rel}^{improve}$$

- $\theta_{rel}^{improve} = 0.05$ (5% 이상 상대 개선)

#### 2.2.3 연속 개선 감지 (Consecutive Improvement)

최근 $k$일 연속으로 전일 대비 점수가 상승:

$$\forall i \in [0, k-1]: s(t-i) > s(t-i-1)$$

- $k = 5$ (5일 연속 상승)

#### 2.2.4 Pseudocode

```python
def threshold_screen_improvement(user_id, current_date):
    """
    Stage 1: 빠른 임계값 기반 개선 후보 선별.
    매일 새 측정이 기록될 때 실행된다.
    """
    scores = query_daily_skin_scores(
        user_id=user_id,
        date_from=current_date - timedelta(days=21),
        date_to=current_date
    )

    if len(scores) < 7:
        return ImprovementCandidate(detected=False, reason="insufficient_data")

    ma7_current = compute_ma7(scores, current_date)
    ma7_prev_week = compute_ma7(scores, current_date - timedelta(days=7))

    if ma7_current is None or ma7_prev_week is None:
        return ImprovementCandidate(detected=False, reason="ma_unavailable")

    # 절대 개선 체크
    abs_change = ma7_current - ma7_prev_week
    if abs_change > 3.0:
        return ImprovementCandidate(
            detected=True,
            type="absolute",
            delta=abs_change,
            confidence="preliminary"
        )

    # 상대 개선 체크
    rel_change = abs_change / (ma7_prev_week + 0.01)
    if rel_change > 0.05:
        return ImprovementCandidate(
            detected=True,
            type="relative",
            delta=rel_change,
            confidence="preliminary"
        )

    # 연속 개선 체크
    recent = get_recent_scores(scores, n=5)
    if all(recent[i] > recent[i+1] for i in range(len(recent)-1)):
        return ImprovementCandidate(
            detected=True,
            type="consecutive",
            streak=len(recent),
            confidence="preliminary"
        )

    return ImprovementCandidate(detected=False)
```

### 2.3 Stage 2: Statistical Confirmation (통계적 확인)

Threshold를 통과한 후보에 대해 통계적 유의성을 검증한다.

#### 2.3.1 Two-Window Comparison Test

최근 2주 vs 이전 2주의 점수 분포를 비교한다:

$$H_0: \mu_{recent} \leq \mu_{previous} \quad \text{(개선 없음)}$$
$$H_1: \mu_{recent} > \mu_{previous} \quad \text{(개선 있음)}$$

**단측 검정 (one-tailed test)** 사용:

```python
def statistical_confirm_improvement(user_id, current_date):
    """
    Stage 2: 통계적 유의성 확인.
    """
    recent_scores = query_daily_skin_scores(
        user_id, current_date - timedelta(days=14), current_date
    )
    previous_scores = query_daily_skin_scores(
        user_id, current_date - timedelta(days=28), current_date - timedelta(days=14)
    )

    if len(recent_scores) < 5 or len(previous_scores) < 5:
        return StatResult(confirmed=False, reason="insufficient_samples")

    # Welch's t-test (단측)
    t_stat, p_value_two = scipy.stats.ttest_ind(
        recent_scores, previous_scores, equal_var=False
    )
    p_value = p_value_two / 2  # 단측 변환

    # 효과 크기
    pooled_std = np.sqrt(
        ((len(recent_scores)-1)*np.var(recent_scores, ddof=1) +
         (len(previous_scores)-1)*np.var(previous_scores, ddof=1)) /
        (len(recent_scores) + len(previous_scores) - 2)
    )
    cohens_d = (np.mean(recent_scores) - np.mean(previous_scores)) / pooled_std

    is_significant = p_value < 0.05 and t_stat > 0
    is_meaningful = abs(cohens_d) >= 0.3  # 최소 small-medium effect

    return StatResult(
        confirmed=is_significant and is_meaningful,
        p_value=p_value,
        cohens_d=cohens_d,
        mean_recent=np.mean(recent_scores),
        mean_previous=np.mean(previous_scores)
    )
```

### 2.4 Stage 3: Contextual Analysis (맥락 분석)

통계적으로 확인된 개선에 대해, **어떤 지표가 개선되었는지** 세부 분석한다.

```python
def contextual_analysis_improvement(user_id, current_date):
    """
    Stage 3: 개선된 세부 지표를 식별한다.
    """
    metrics = ["hydration_norm", "elasticity_norm", "pore_norm",
               "wrinkle_norm", "pigmentation_norm"]

    improved_metrics = []
    for metric in metrics:
        recent = query_metric_scores(user_id, metric,
            current_date - timedelta(days=14), current_date)
        previous = query_metric_scores(user_id, metric,
            current_date - timedelta(days=28), current_date - timedelta(days=14))

        if len(recent) < 5 or len(previous) < 5:
            continue

        delta = np.mean(recent) - np.mean(previous)
        t_stat, p_val = scipy.stats.ttest_ind(recent, previous, equal_var=False)

        if p_val / 2 < 0.05 and delta > 0:
            improved_metrics.append({
                "metric": metric,
                "delta": delta,
                "p_value": p_val / 2,
                "description": METRIC_DESCRIPTIONS[metric]
            })

    # 가장 크게 개선된 지표 순으로 정렬
    improved_metrics.sort(key=lambda x: x["delta"], reverse=True)

    return ContextResult(
        improved_metrics=improved_metrics,
        summary=generate_improvement_summary(improved_metrics)
    )
```

---

## 3. 피부 악화 감지 알고리즘 (Skin Deterioration Detection) - 조기 경고 시스템

### 3.1 설계 원칙

악화 감지는 개선 감지보다 **더 민감하고 빠르게** 작동해야 한다. 사용자의 피부 건강을 보호하기 위해 false negative를 최소화하는 것이 핵심이다.

| 비교 항목 | 개선 감지 | 악화 감지 |
|---|---|---|
| 민감도 | 보통 | 높음 |
| 특이도 | 높음 | 보통 |
| 반응 속도 | 7~14일 | 3~7일 |
| 임계값 | 보수적 | 공격적 |
| 오탐 허용 | 낮음 | 중간 (안전 우선) |

### 3.2 다단계 경고 시스템 (Multi-Level Alert System)

```
Level 0: 정상
  │
  │  MA_3 하락 > θ₁ (경미한 하락 3일)
  ▼
Level 1: 주의 (Watch) ──── "피부 상태를 주의 깊게 관찰해주세요"
  │
  │  MA_7 하락 > θ₂ (지속적 하락 7일)
  ▼
Level 2: 경고 (Warning) ── "피부 상태가 악화되고 있을 수 있어요"
  │
  │  통계적 유의성 확인 + MA_14 하락
  ▼
Level 3: 심각 (Alert) ──── "피부 상태가 크게 나빠졌어요. 루틴을 점검해보세요"
```

### 3.3 Level 1: 주의 (Watch)

짧은 기간의 빠른 하락을 감지한다:

$$\text{MA}_3(t) - \text{MA}_3(t - 3) < -\theta_1$$

$$\theta_1 = 2.0 \quad \text{(3일 이동평균이 3일 전 대비 2점 이상 하락)}$$

추가 조건:
- 최근 3일 중 2일 이상 하락 추세
- 이상치(anomaly)가 아닌 것으로 확인

```python
def detect_watch_level(user_id, current_date):
    """Level 1 주의 감지: 3일 단기 하락."""
    scores_7d = query_daily_skin_scores(
        user_id, current_date - timedelta(days=7), current_date
    )

    if len(scores_7d) < 4:
        return WatchResult(level=0)

    ma3_current = compute_ma(scores_7d, current_date, window=3)
    ma3_prev = compute_ma(scores_7d, current_date - timedelta(days=3), window=3)

    if ma3_current is None or ma3_prev is None:
        return WatchResult(level=0)

    decline = ma3_prev - ma3_current  # 양수면 하락

    if decline > 2.0:
        # 이상치 여부 확인
        if is_anomaly(scores_7d, current_date):
            return WatchResult(level=0, note="anomaly_detected")

        return WatchResult(
            level=1,
            decline_amount=decline,
            period_days=3,
            message="피부 상태가 최근 며칠간 약간 나빠진 것 같아요. 주의 깊게 관찰해볼까요?"
        )

    return WatchResult(level=0)
```

### 3.4 Level 2: 경고 (Warning)

1주 이상 지속적 하락을 감지한다:

$$\text{MA}_7(t) - \text{MA}_7(t - 7) < -\theta_2$$

$$\theta_2 = 3.0 \quad \text{(7일 이동평균이 전주 대비 3점 이상 하락)}$$

추가 조건:
- `trend_direction == 'declining'` 이 3일 이상 지속
- `trend_velocity < -0.3` (주당 0.3점 이상 하락 속도)

```python
def detect_warning_level(user_id, current_date):
    """Level 2 경고 감지: 7일 지속 하락."""
    scores_21d = query_daily_skin_scores(
        user_id, current_date - timedelta(days=21), current_date
    )

    ma7_current = compute_ma(scores_21d, current_date, window=7)
    ma7_prev = compute_ma(scores_21d, current_date - timedelta(days=7), window=7)

    if ma7_current is None or ma7_prev is None:
        return WarningResult(level=0)

    decline = ma7_prev - ma7_current

    # trend_direction 연속 declining 체크
    recent_trends = query_trend_directions(
        user_id, current_date - timedelta(days=7), current_date
    )
    consecutive_declining = count_consecutive(recent_trends, "declining")

    if decline > 3.0 and consecutive_declining >= 3:
        return WarningResult(
            level=2,
            decline_amount=decline,
            consecutive_declining_days=consecutive_declining,
            message="피부 상태가 지난주보다 나빠지고 있어요. 최근 변경한 제품이나 습관이 있나요?"
        )

    return WarningResult(level=0)
```

### 3.5 Level 3: 심각 (Alert)

통계적으로 확인된 유의미한 악화:

```python
def detect_alert_level(user_id, current_date):
    """Level 3 심각 감지: 통계적으로 유의미한 악화."""
    recent_14d = query_daily_skin_scores(
        user_id, current_date - timedelta(days=14), current_date
    )
    previous_14d = query_daily_skin_scores(
        user_id, current_date - timedelta(days=28), current_date - timedelta(days=14)
    )

    if len(recent_14d) < 7 or len(previous_14d) < 7:
        return AlertResult(level=0)

    # 단측 t-test (악화 방향)
    t_stat, p_value_two = scipy.stats.ttest_ind(
        recent_14d, previous_14d, equal_var=False
    )
    p_value = p_value_two / 2

    is_deteriorating = p_value < 0.05 and t_stat < 0

    if not is_deteriorating:
        return AlertResult(level=0)

    # 효과 크기 확인
    pooled_std = np.sqrt(
        ((len(recent_14d)-1)*np.var(recent_14d, ddof=1) +
         (len(previous_14d)-1)*np.var(previous_14d, ddof=1)) /
        (len(recent_14d) + len(previous_14d) - 2)
    )
    cohens_d = (np.mean(recent_14d) - np.mean(previous_14d)) / pooled_std

    if abs(cohens_d) >= 0.5:  # medium effect 이상
        # 어떤 지표가 악화되었는지 식별
        deteriorated_metrics = identify_deteriorated_metrics(user_id, current_date)

        return AlertResult(
            level=3,
            p_value=p_value,
            cohens_d=cohens_d,
            deteriorated_metrics=deteriorated_metrics,
            message="피부 상태가 크게 나빠졌어요. 루틴을 점검하고, 최근 변경 사항을 확인해보세요."
        )

    return AlertResult(level=0)
```

### 3.6 종합 악화 감지 파이프라인

```python
def detect_skin_deterioration(user_id, current_date):
    """
    악화 감지의 전체 파이프라인.
    Level 3 → 2 → 1 순으로 체크하여, 가장 심각한 레벨을 반환한다.
    """
    # Level 3 체크 (가장 심각)
    alert = detect_alert_level(user_id, current_date)
    if alert.level == 3:
        return DeteriorationResult(
            level=3,
            alert=alert,
            action="routine_review_suggested",
            notify=True,
            urgency="high"
        )

    # Level 2 체크
    warning = detect_warning_level(user_id, current_date)
    if warning.level == 2:
        return DeteriorationResult(
            level=2,
            warning=warning,
            action="monitoring_enhanced",
            notify=True,
            urgency="medium"
        )

    # Level 1 체크
    watch = detect_watch_level(user_id, current_date)
    if watch.level == 1:
        return DeteriorationResult(
            level=1,
            watch=watch,
            action="observation",
            notify=False,  # Level 1은 앱 내 표시만 (푸시 알림 안함)
            urgency="low"
        )

    return DeteriorationResult(level=0, action="none")
```

---

## 4. 제품 영향 가능성 계산 (Product Impact Probability)

### 4.1 개념

피부 변화가 감지되었을 때, 최근 변경된 제품이 그 변화의 원인일 가능성을 계산한다. 이는 `product_usage_history`의 변경 이벤트와 피부 변화 시점의 **시간적 상관관계**를 기반으로 한다.

### 4.2 제품 변경 이벤트 감지

```python
def detect_product_changes(user_id, lookback_days=28):
    """
    최근 N일 내에 변경된 제품 이벤트를 식별한다.
    """
    cutoff_date = date.today() - timedelta(days=lookback_days)

    # 새로 추가된 제품
    added_products = query_product_usage(
        user_id=user_id,
        start_date_after=cutoff_date,
        is_active=True
    )

    # 최근 제거된 제품
    removed_products = query_product_usage(
        user_id=user_id,
        end_date_after=cutoff_date,
        is_active=False
    )

    changes = []
    for p in added_products:
        changes.append(ProductChangeEvent(
            product_id=p.product_id,
            change_type="added",
            change_date=p.start_date,
            days_since_change=(date.today() - p.start_date).days
        ))
    for p in removed_products:
        changes.append(ProductChangeEvent(
            product_id=p.product_id,
            change_type="removed",
            change_date=p.end_date,
            days_since_change=(date.today() - p.end_date).days
        ))

    return sorted(changes, key=lambda c: c.change_date, reverse=True)
```

### 4.3 시간적 상관 점수 (Temporal Correlation Score)

제품 변경 시점과 피부 변화 감지 시점 간의 시간 간격이 짧을수록 해당 제품이 원인일 가능성이 높다.

$$P_{temporal}(p) = \exp\left(-\frac{(\Delta t_p - \tau_{expected})^2}{2\sigma_{lag}^2}\right)$$

여기서:
- $\Delta t_p$: 제품 $p$ 변경일과 피부 변화 감지일 사이의 일수
- $\tau_{expected}$: 제품 카테고리별 기대 효과 발현 기간 (일)
- $\sigma_{lag} = 7$ (일): 효과 발현 시간의 분산

**카테고리별 기대 효과 발현 기간:**

| 카테고리 | $\tau_{expected}$ (일) | 설명 |
|---|---|---|
| `cleanser` | 3~7 | 클렌저: 즉시~단기 |
| `toner` | 7~14 | 토너: 1~2주 |
| `serum` | 14~28 | 세럼: 2~4주 |
| `essence` | 14~21 | 에센스: 2~3주 |
| `ampoule` | 7~21 | 앰플: 1~3주 |
| `cream` | 14~28 | 크림: 2~4주 |
| `sunscreen` | 7~14 | 선크림: 1~2주 |
| `mask` | 1~3 | 마스크팩: 즉시~단기 |

```python
EXPECTED_EFFECT_LAG = {
    "cleanser": 5, "toner": 10, "serum": 21,
    "essence": 17, "ampoule": 14, "cream": 21,
    "eye_cream": 28, "sunscreen": 10, "mask": 2, "other": 14
}

def temporal_correlation_score(change_date, detection_date, product_category):
    """제품 변경 시점과 피부 변화 감지 시점의 시간적 상관 점수."""
    delta_t = (detection_date - change_date).days
    tau = EXPECTED_EFFECT_LAG.get(product_category, 14)
    sigma_lag = 7

    if delta_t < 0:
        return 0  # 피부 변화가 제품 변경 전이면 관계없음

    score = np.exp(-((delta_t - tau) ** 2) / (2 * sigma_lag ** 2))
    return score
```

### 4.4 성분 관련성 점수 (Ingredient Relevance Score)

변화된 피부 지표와 제품의 주요 성분 간의 관련성:

$$P_{ingredient}(p, m) = \max_{i \in \text{ingredients}(p)} \text{EFFECT\_MAP}[i][m]$$

04번 문서의 `INGREDIENT_EFFECT_MAP`을 재사용한다.

### 4.5 종합 제품 영향 가능성 (Product Impact Probability)

$$P_{impact}(p) = w_t \cdot P_{temporal}(p) + w_i \cdot P_{ingredient}(p) + w_h \cdot P_{historical}(p)$$

여기서:
- $w_t = 0.4$: 시간적 상관 가중치
- $w_i = 0.35$: 성분 관련성 가중치
- $w_h = 0.25$: 히스토리 기반 가중치
- $P_{historical}(p)$: 해당 제품의 과거 효과 분석 결과 기반 점수

```python
def compute_product_impact_probability(
    user_id, product_change, detected_change, changed_metrics
):
    """
    피부 변화에 대한 특정 제품의 영향 가능성을 종합 산출한다.
    """
    product = get_product(product_change.product_id)

    # 1. 시간적 상관 점수
    p_temporal = temporal_correlation_score(
        product_change.change_date,
        detected_change.detection_date,
        product.category
    )

    # 2. 성분 관련성 점수 (변화된 지표 기준)
    relevance_scores = []
    for metric in changed_metrics:
        p_ing = ingredient_relevance_score(product, metric)
        relevance_scores.append(p_ing)
    p_ingredient = np.mean(relevance_scores) if relevance_scores else 0

    # 3. 히스토리 기반 점수 (과거 효과 분석 결과)
    past_analyses = query_product_effect_analyses(
        user_id=user_id,
        product_id=product_change.product_id
    )
    if past_analyses:
        latest = past_analyses[0]
        # 과거에 효과가 확인된 제품이면 점수 부여
        p_historical = min(abs(latest.effect_score) / 50, 1.0) * latest.confidence_level
    else:
        p_historical = 0.3  # 분석 이력 없으면 중립

    # 4. 종합 점수
    p_impact = 0.4 * p_temporal + 0.35 * p_ingredient + 0.25 * p_historical

    # 5. 방향 판단
    if product_change.change_type == "added":
        impact_direction = detected_change.direction  # 추가 후 변화 방향 = 제품 영향 방향
    else:  # removed
        # 제거 후 개선 → 제품이 악영향이었음, 제거 후 악화 → 제품이 좋았음
        impact_direction = "negative" if detected_change.direction == "improved" else "positive"

    return ProductImpactResult(
        product_id=product_change.product_id,
        product_name=product.product_name,
        impact_probability=p_impact,
        impact_direction=impact_direction,
        temporal_score=p_temporal,
        ingredient_score=p_ingredient,
        historical_score=p_historical,
        change_type=product_change.change_type,
        days_since_change=product_change.days_since_change
    )
```

### 4.6 영향 가능성 해석 (Interpretation)

| $P_{impact}$ | 해석 | UI 표시 |
|---|---|---|
| $\geq 0.7$ | 높은 관련성 | "이 제품이 피부 변화의 주요 원인일 가능성이 높아요" |
| $0.4$ ~ $0.7$ | 중간 관련성 | "이 제품이 영향을 줬을 수 있어요" |
| $0.2$ ~ $0.4$ | 낮은 관련성 | "이 제품과의 관련성은 낮지만 참고해주세요" |
| $< 0.2$ | 무관 | 표시하지 않음 |

---

## 5. 변화 감지 시점 알림 로직 (Change Detection Alert Logic)

### 5.1 알림 유형 및 채널

| 알림 유형 | 채널 | 조건 | 빈도 제한 |
|---|---|---|---|
| **개선 알림** | 앱 내 + Push | Stage 2 통과 | 주 1회 이하 |
| **악화 경고 L1** | 앱 내만 | Level 1 감지 | 주 2회 이하 |
| **악화 경고 L2** | 앱 내 + Push | Level 2 감지 | 주 1회 이하 |
| **악화 경고 L3** | 앱 내 + Push (강조) | Level 3 감지 | 즉시 (중복 방지 24h) |
| **제품 영향 알림** | 앱 내 | $P_{impact} \geq 0.4$ | 제품당 1회 |
| **마일스톤 달성** | 앱 내 + Push | 최고점 갱신, 연속 개선 등 | 이벤트 발생 시 |

### 5.2 알림 피로도 관리 (Notification Fatigue Prevention)

사용자가 알림 피로를 느끼지 않도록 다음 규칙을 적용한다:

```python
class AlertThrottler:
    """알림 빈도를 제한하여 알림 피로를 방지한다."""

    COOLDOWN_RULES = {
        "improvement": timedelta(days=7),     # 개선 알림: 7일 쿨다운
        "deterioration_l1": timedelta(days=3), # L1 주의: 3일 쿨다운
        "deterioration_l2": timedelta(days=7), # L2 경고: 7일 쿨다운
        "deterioration_l3": timedelta(hours=24), # L3 심각: 24시간 쿨다운
        "product_impact": None,               # 제품당 1회 (쿨다운 없음)
        "milestone": timedelta(days=1),        # 마일스톤: 1일 쿨다운
    }

    MAX_DAILY_NOTIFICATIONS = 3  # 하루 최대 3개 알림
    MAX_WEEKLY_NOTIFICATIONS = 7  # 주 최대 7개 알림

    def should_send(self, user_id, alert_type, context=None):
        """알림을 보내야 하는지 판단한다."""
        # 사용자 알림 설정 확인
        user = get_user(user_id)
        if not user.notification_enabled:
            return False

        # 일일/주간 한도 확인
        daily_count = count_notifications(user_id, period="today")
        weekly_count = count_notifications(user_id, period="this_week")

        if daily_count >= self.MAX_DAILY_NOTIFICATIONS:
            return False
        if weekly_count >= self.MAX_WEEKLY_NOTIFICATIONS:
            # L3 경고는 한도 무시
            if alert_type != "deterioration_l3":
                return False

        # 쿨다운 확인
        cooldown = self.COOLDOWN_RULES.get(alert_type)
        if cooldown:
            last_sent = get_last_notification(user_id, alert_type)
            if last_sent and (datetime.now() - last_sent) < cooldown:
                return False

        # 제품 영향 알림: 동일 제품에 대해 이미 발송했는지
        if alert_type == "product_impact" and context:
            already_notified = has_product_impact_notification(
                user_id, context.get("product_id")
            )
            if already_notified:
                return False

        return True
```

### 5.3 알림 생성 파이프라인

```python
def generate_change_alert(user_id, detection_result):
    """
    감지 결과를 기반으로 적절한 알림을 생성한다.
    """
    throttler = AlertThrottler()

    alerts = []

    # 개선 알림
    if detection_result.improvement and detection_result.improvement.confirmed:
        if throttler.should_send(user_id, "improvement"):
            improved = detection_result.improvement.improved_metrics
            top_metric = improved[0]["metric"] if improved else "overall"

            alerts.append(Alert(
                type="improvement",
                title="피부 상태가 좋아지고 있어요!",
                body=f"최근 2주간 {METRIC_LABELS[top_metric]}이(가) "
                     f"{abs(improved[0]['delta']*100):.1f}% 개선되었어요.",
                priority="normal",
                channel=["in_app", "push"],
                data={"metrics": improved}
            ))

    # 악화 경고
    if detection_result.deterioration and detection_result.deterioration.level > 0:
        det = detection_result.deterioration
        alert_type = f"deterioration_l{det.level}"

        if throttler.should_send(user_id, alert_type):
            alerts.append(Alert(
                type=alert_type,
                title=DETERIORATION_TITLES[det.level],
                body=det.message,
                priority="high" if det.level >= 2 else "normal",
                channel=["in_app", "push"] if det.level >= 2 else ["in_app"],
                data={"level": det.level, "decline": det.decline_amount}
            ))

    # 제품 영향 알림
    if detection_result.product_impacts:
        for impact in detection_result.product_impacts:
            if impact.impact_probability >= 0.4:
                context = {"product_id": impact.product_id}
                if throttler.should_send(user_id, "product_impact", context):
                    alerts.append(Alert(
                        type="product_impact",
                        title="제품 영향 분석 결과",
                        body=f"'{impact.product_name}'이(가) 최근 피부 변화에 "
                             f"영향을 줬을 가능성이 있어요.",
                        priority="normal",
                        channel=["in_app"],
                        data={"product_id": impact.product_id,
                              "probability": impact.impact_probability}
                    ))

    return alerts

DETERIORATION_TITLES = {
    1: "피부 상태 관찰 필요",
    2: "피부 상태 변화 감지",
    3: "피부 상태 주의 필요"
}

METRIC_LABELS = {
    "hydration_norm": "수분",
    "elasticity_norm": "탄력",
    "pore_norm": "모공",
    "wrinkle_norm": "주름",
    "pigmentation_norm": "색소침착",
    "overall": "종합 피부 점수"
}
```

---

## 6. False Positive / False Negative 최소화 전략

### 6.1 오류 유형 정의

| 오류 유형 | 정의 | 영향 | 위험도 |
|---|---|---|---|
| **False Positive (FP)** | 실제 변화 없는데 변화 감지 | 불필요한 알림 → 사용자 신뢰 하락 | 중간 |
| **False Negative (FN)** | 실제 변화 있는데 감지 못함 | 악화 방치 → 사용자 피부 건강 위험 | 높음 |
| **Type III Error** | 변화 방향을 잘못 판단 | 개선인데 악화로 알림 (또는 반대) | 높음 |

### 6.2 False Positive 최소화

#### 6.2.1 다단계 확인 (Multi-Stage Confirmation)

Stage 1 (Threshold) → Stage 2 (Statistical) → Stage 3 (Contextual) 의 3단계 필터링으로 FP를 단계적으로 걸러낸다.

**예상 FP 감소율:**

| 단계 | 통과율 | 누적 FP율 |
|---|---|---|
| Raw (감지 없음) | - | ~30% |
| Stage 1 (Threshold) | ~40% 통과 | ~12% |
| Stage 2 (Statistical) | ~50% 통과 | ~6% |
| Stage 3 (Contextual) | ~70% 통과 | ~4% |

#### 6.2.2 이상치 배제 (Anomaly Exclusion)

단일 일자의 극단적 점수 변동은 측정 오차일 가능성이 높다. z-score 기반으로 이상치를 감지하고 분석에서 제외한다.

$$z(t) = \frac{s(t) - \text{MA}_7(t)}{\sigma_{rolling}}$$

$$\text{is\_anomaly}(t) = |z(t)| > 2.5$$

```python
def detect_anomaly(scores, current_idx, ma7, rolling_std):
    """z-score 기반 이상치 감지."""
    z = (scores[current_idx] - ma7) / (rolling_std + 0.01)
    return abs(z) > 2.5
```

#### 6.2.3 최소 지속 기간 요건 (Minimum Persistence)

단기 변동과 진정한 추세를 구분하기 위해, 감지된 변화가 일정 기간 지속되는지 확인한다:

- **개선 감지**: 최소 5일 이상 개선 추세 유지
- **악화 감지 L1**: 최소 3일 이상 하락
- **악화 감지 L2**: 최소 5일 이상 하락
- **악화 감지 L3**: 최소 7일 이상 + 통계적 확인

```python
def check_persistence(user_id, detection_type, current_date, min_days):
    """변화가 최소 기간 이상 지속되는지 확인한다."""
    scores = query_daily_skin_scores(
        user_id, current_date - timedelta(days=min_days), current_date
    )

    if len(scores) < min_days * 0.5:  # 절반 이상 데이터 필요
        return False

    if detection_type == "improvement":
        # 기간 내 전반적 상승 추세
        slope = linear_regression_slope(scores)
        return slope > 0
    elif detection_type == "deterioration":
        slope = linear_regression_slope(scores)
        return slope < 0

    return False
```

### 6.3 False Negative 최소화

#### 6.3.1 악화 감지의 민감도 높이기

악화 감지에는 **더 낮은 임계값**과 **더 짧은 관찰 기간**을 적용한다:

| 파라미터 | 개선 감지 | 악화 감지 | 이유 |
|---|---|---|---|
| 절대 임계값 | 3.0 | 2.0 | 악화는 더 빨리 감지 |
| 관찰 기간 | 14일 | 7일 (L1: 3일) | 조기 대응 |
| 유의수준 $\alpha$ | 0.05 | 0.10 | FN보다 FP 허용 |
| 최소 효과 크기 | 0.5 (medium) | 0.3 (small-medium) | 작은 악화도 감지 |

#### 6.3.2 지표별 독립 감지

종합 점수(`overall_score`)만으로는 특정 지표의 악화를 놓칠 수 있다. 각 개별 지표도 독립적으로 모니터링한다:

```python
def detect_metric_specific_deterioration(user_id, current_date):
    """
    개별 지표별 악화를 독립적으로 감지한다.
    종합 점수가 안정적이더라도 특정 지표가 악화될 수 있다.
    """
    metrics = ["hydration_norm", "elasticity_norm", "pore_norm",
               "wrinkle_norm", "pigmentation_norm"]

    deteriorated = []
    for metric in metrics:
        recent = query_metric_scores(
            user_id, metric,
            current_date - timedelta(days=7), current_date
        )
        previous = query_metric_scores(
            user_id, metric,
            current_date - timedelta(days=14), current_date - timedelta(days=7)
        )

        if len(recent) < 3 or len(previous) < 3:
            continue

        decline = np.mean(previous) - np.mean(recent)
        relative_decline = decline / (np.mean(previous) + 0.01)

        # 개별 지표가 10% 이상 악화
        if relative_decline > 0.10:
            deteriorated.append({
                "metric": metric,
                "decline": decline,
                "relative_decline": relative_decline,
                "label": METRIC_LABELS[metric]
            })

    return deteriorated
```

#### 6.3.3 주말 효과 보정 (Weekend Effect)

주말에 루틴을 건너뛰거나 활동 패턴이 변하는 사용자가 많다. 주말의 일시적 변동을 과도하게 감지하지 않도록 보정한다:

```python
def adjust_for_day_of_week(scores, dates):
    """요일별 평균 편차를 계산하여 보정한다."""
    day_means = {}
    for score, d in zip(scores, dates):
        dow = d.weekday()
        day_means.setdefault(dow, []).append(score)

    overall_mean = np.mean(scores)
    day_adjustments = {
        dow: overall_mean - np.mean(vals)
        for dow, vals in day_means.items()
    }

    adjusted = [
        score + day_adjustments.get(d.weekday(), 0)
        for score, d in zip(scores, dates)
    ]
    return adjusted
```

### 6.4 종합 오류 제어 매트릭스

```
                        실제 변화 있음        실제 변화 없음
                    ┌───────────────────┬──────────────────┐
감지함              │   True Positive   │  False Positive   │
                    │   (정확한 감지)    │  (오탐)           │
                    │                   │  → 다단계 확인    │
                    │                   │  → 이상치 배제    │
                    │                   │  → 최소 지속기간   │
                    ├───────────────────┼──────────────────┤
감지 못함           │  False Negative   │  True Negative    │
                    │  (미탐)           │  (정확한 무감지)   │
                    │  → 낮은 임계값    │                   │
                    │  → 지표별 독립감지 │                   │
                    │  → 민감 유의수준   │                   │
                    └───────────────────┴──────────────────┘
```

---

## 7. 여러 지표 종합 판단 로직 (Multi-Metric Composite Judgment)

### 7.1 문제 정의

피부 상태는 5개 지표(수분, 탄력, 모공, 주름, 색소침착)로 측정되며, 지표들은 서로 다른 방향으로 변할 수 있다. 예를 들어:
- 수분은 개선되었지만 모공은 악화
- 모든 지표가 약간씩 개선 (개별로는 유의하지 않지만 종합적으로는 개선)

### 7.2 종합 판단 전략

#### 7.2.1 Weighted Composite Score (가중 종합 점수)

이미 `daily_skin_scores.overall_score`가 가중 평균으로 산출되므로, 이를 기본 종합 지표로 사용한다.

하지만 추가적으로, 사용자 맞춤 가중 종합 점수를 산출한다:

$$\text{CS}_{user}(t) = \sum_{m \in M} w_m^{user} \cdot s_m^{norm}(t)$$

여기서 $w_m^{user}$는 사용자의 `skin_concerns` 기반 맞춤 가중치이다 (04번 문서 Section 6.3.2 참조).

#### 7.2.2 Multi-Metric Concordance (다지표 일치도)

여러 지표가 **같은 방향**으로 변하는지를 평가한다:

$$\text{Concordance} = \frac{|\{m : \text{sign}(\Delta_m) = \text{sign}(\Delta_{majority})\}|}{|M|}$$

- Concordance $\geq 0.8$: 강한 일치 (4/5 이상 동일 방향)
- Concordance $\geq 0.6$: 보통 일치 (3/5 이상)
- Concordance $< 0.6$: 혼합 변화 (지표별 방향이 다름)

```python
def compute_concordance(metric_deltas):
    """
    여러 지표의 변화 방향 일치도를 계산한다.
    """
    directions = [
        1 if d["delta"] > 0 else -1 if d["delta"] < 0 else 0
        for d in metric_deltas.values()
    ]

    if not directions:
        return 0

    positive_count = sum(1 for d in directions if d > 0)
    negative_count = sum(1 for d in directions if d < 0)
    majority_direction = 1 if positive_count >= negative_count else -1

    concordant = sum(
        1 for d in directions if d == majority_direction or d == 0
    )
    concordance = concordant / len(directions)

    return ConcordanceResult(
        score=concordance,
        majority_direction="improving" if majority_direction > 0 else "declining",
        concordant_count=concordant,
        total_count=len(directions)
    )
```

#### 7.2.3 Multi-Metric Decision Matrix

```python
def multi_metric_judgment(metric_deltas, user_concerns):
    """
    여러 지표를 종합하여 최종 판단을 내린다.
    """
    concordance = compute_concordance(metric_deltas)

    # 관심 지표 변화 확인
    concern_metrics = get_concern_metrics(user_concerns)
    concern_deltas = {
        m: d for m, d in metric_deltas.items()
        if m in concern_metrics
    }

    # 판단 로직
    if concordance.score >= 0.8:
        # 대부분의 지표가 같은 방향
        if concordance.majority_direction == "improving":
            return Judgment(
                type="overall_improvement",
                confidence="high",
                summary="대부분의 피부 지표가 개선되고 있어요",
                detail_metrics=sorted(
                    metric_deltas.items(),
                    key=lambda x: x[1]["delta"],
                    reverse=True
                )
            )
        else:
            return Judgment(
                type="overall_deterioration",
                confidence="high",
                summary="여러 피부 지표가 동시에 나빠지고 있어요",
                detail_metrics=sorted(
                    metric_deltas.items(),
                    key=lambda x: x[1]["delta"]
                )
            )

    elif concordance.score >= 0.6:
        # 대체로 일치하지만 일부 예외
        improving = {m: d for m, d in metric_deltas.items() if d["delta"] > 0}
        declining = {m: d for m, d in metric_deltas.items() if d["delta"] < 0}

        return Judgment(
            type="mixed_with_trend",
            confidence="medium",
            summary=f"{len(improving)}개 지표 개선, {len(declining)}개 지표 악화",
            improving=improving,
            declining=declining,
            primary_direction=concordance.majority_direction
        )

    else:
        # 혼합 변화: 개별 지표별 상세 보고
        return Judgment(
            type="mixed",
            confidence="low",
            summary="피부 지표별로 다른 변화가 관찰되고 있어요",
            improving={m: d for m, d in metric_deltas.items() if d["delta"] > 0},
            declining={m: d for m, d in metric_deltas.items() if d["delta"] < 0},
            stable={m: d for m, d in metric_deltas.items()
                    if abs(d["delta"]) < 0.02}  # 2% 미만 변화는 안정
        )
```

### 7.3 사용자 관심 지표 우선 표시

종합 판단에서 사용자의 `skin_concerns`에 해당하는 지표를 우선적으로 보여준다:

```python
def prioritize_display(judgment, user_concerns):
    """
    사용자 관심 지표를 우선 표시하도록 정렬한다.
    """
    CONCERN_TO_METRIC = {
        "dryness": "hydration_norm",
        "sagging": "elasticity_norm",
        "pore": "pore_norm",
        "wrinkle": "wrinkle_norm",
        "pigmentation": "pigmentation_norm"
    }

    concern_metrics = {CONCERN_TO_METRIC[c] for c in user_concerns if c in CONCERN_TO_METRIC}

    # 관심 지표를 앞으로 정렬
    all_metrics = list(judgment.detail_metrics or [])
    prioritized = sorted(all_metrics, key=lambda x: (
        0 if x[0] in concern_metrics else 1,  # 관심 지표 우선
        -abs(x[1]["delta"])                    # 변화 크기 순
    ))

    return prioritized
```

---

## 8. 전체 감지 엔진 통합 (Detection Engine Integration)

### 8.1 일일 감지 실행 흐름

```
사용자가 새 측정 기록
         │
         ▼
┌─────────────────────────────────┐
│ 1. daily_skin_scores 업데이트    │
│   - 정규화 점수 저장             │
│   - MA_7 계산                   │
│   - trend_direction 업데이트     │
│   - is_anomaly 플래그 설정       │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 2. 이상치 감지                   │
│   - z-score 기반 이상치 판별     │
│   - 이상치이면 플래그만 설정      │
└─────────────┬───────────────────┘
              │
      ┌───────┴───────┐
      │               │
      ▼               ▼
┌───────────┐   ┌───────────────┐
│ 3a. 개선  │   │ 3b. 악화      │
│ 감지      │   │ 감지          │
│ Pipeline  │   │ Pipeline      │
└─────┬─────┘   └──────┬────────┘
      │                │
      └───────┬────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 4. 제품 영향 분석                │
│   - 최근 제품 변경 이벤트 조회    │
│   - 변화-제품 시간 상관 계산      │
│   - 성분 관련성 분석             │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 5. 다지표 종합 판단              │
│   - Concordance 계산             │
│   - 관심 지표 우선 처리           │
│   - 최종 판단 결과 생성           │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 6. 알림 생성 및 발송             │
│   - AlertThrottler 확인          │
│   - 알림 생성                    │
│   - Push / In-App 발송           │
└─────────────────────────────────┘
```

### 8.2 메인 감지 엔진 코드

```python
class SkinChangeDetectionEngine:
    """
    피부 변화 감지 엔진.
    새 측정이 기록될 때마다 실행된다.
    """

    def __init__(self):
        self.throttler = AlertThrottler()

    def run(self, user_id, measurement_date):
        """
        전체 감지 파이프라인을 실행한다.
        """
        # 0. 사전 데이터 확인
        data_count = count_daily_scores(user_id)
        if data_count < 7:
            return DetectionResult(status="insufficient_data",
                                   message="최소 7일의 데이터가 필요합니다")

        # 1. 이상치 감지
        is_anomaly = self._detect_anomaly(user_id, measurement_date)
        if is_anomaly:
            update_anomaly_flag(user_id, measurement_date, True)

        # 2. 개선 감지 (이상치가 아닌 경우만)
        improvement = None
        if not is_anomaly:
            improvement = self._detect_improvement(user_id, measurement_date)

        # 3. 악화 감지 (항상 실행, 이상치여도 패턴 분석)
        deterioration = self._detect_deterioration(user_id, measurement_date)

        # 4. 제품 영향 분석 (변화가 감지된 경우만)
        product_impacts = []
        if improvement or (deterioration and deterioration.level > 0):
            product_impacts = self._analyze_product_impact(
                user_id, measurement_date,
                improvement=improvement,
                deterioration=deterioration
            )

        # 5. 다지표 종합 판단
        metric_deltas = self._compute_metric_deltas(user_id, measurement_date)
        judgment = multi_metric_judgment(
            metric_deltas,
            get_user(user_id).skin_concerns
        )

        # 6. 알림 생성
        result = DetectionResult(
            date=measurement_date,
            is_anomaly=is_anomaly,
            improvement=improvement,
            deterioration=deterioration,
            product_impacts=product_impacts,
            judgment=judgment,
            metric_deltas=metric_deltas
        )

        alerts = generate_change_alert(user_id, result)
        for alert in alerts:
            send_notification(user_id, alert)

        return result

    def _detect_anomaly(self, user_id, current_date):
        """이상치 감지."""
        scores_14d = query_daily_skin_scores(
            user_id, current_date - timedelta(days=14), current_date
        )
        if len(scores_14d) < 7:
            return False

        current_score = scores_14d[-1]
        ma7 = np.mean(scores_14d[-7:]) if len(scores_14d) >= 7 else np.mean(scores_14d)
        rolling_std = np.std(scores_14d[-14:])

        z = (current_score - ma7) / (rolling_std + 0.01)
        return abs(z) > 2.5

    def _detect_improvement(self, user_id, current_date):
        """개선 감지 (3단계)."""
        # Stage 1: Threshold
        candidate = threshold_screen_improvement(user_id, current_date)
        if not candidate.detected:
            return None

        # Stage 2: Statistical
        stat_result = statistical_confirm_improvement(user_id, current_date)
        if not stat_result.confirmed:
            return None

        # Stage 3: Context
        context = contextual_analysis_improvement(user_id, current_date)

        return ImprovementDetection(
            confirmed=True,
            trigger=candidate.type,
            statistical=stat_result,
            improved_metrics=context.improved_metrics,
            summary=context.summary
        )

    def _detect_deterioration(self, user_id, current_date):
        """악화 감지 (다단계 경고)."""
        return detect_skin_deterioration(user_id, current_date)

    def _analyze_product_impact(self, user_id, current_date,
                                 improvement=None, deterioration=None):
        """제품 영향 가능성 분석."""
        product_changes = detect_product_changes(user_id, lookback_days=28)

        if not product_changes:
            return []

        # 변화된 지표 식별
        changed_metrics = []
        if improvement:
            changed_metrics = [m["metric"] for m in improvement.improved_metrics]
        elif deterioration and deterioration.level > 0:
            changed_metrics = [m["metric"]
                             for m in identify_deteriorated_metrics(user_id, current_date)]

        if not changed_metrics:
            changed_metrics = ["overall_score"]

        # 변화 방향
        direction = "improving" if improvement else "declining"
        detected_change = DetectedChange(
            detection_date=current_date,
            direction=direction,
            metrics=changed_metrics
        )

        # 각 제품 변경에 대한 영향 가능성 계산
        impacts = []
        for change in product_changes:
            impact = compute_product_impact_probability(
                user_id, change, detected_change, changed_metrics
            )
            if impact.impact_probability >= 0.2:  # 20% 이상만 포함
                impacts.append(impact)

        # 영향 가능성 순으로 정렬
        impacts.sort(key=lambda x: x.impact_probability, reverse=True)
        return impacts[:3]  # 상위 3개만 반환

    def _compute_metric_deltas(self, user_id, current_date):
        """각 지표의 최근 변화량을 계산한다."""
        metrics = ["hydration_norm", "elasticity_norm", "pore_norm",
                   "wrinkle_norm", "pigmentation_norm"]

        deltas = {}
        for metric in metrics:
            recent = query_metric_scores(
                user_id, metric,
                current_date - timedelta(days=7), current_date
            )
            previous = query_metric_scores(
                user_id, metric,
                current_date - timedelta(days=14), current_date - timedelta(days=7)
            )

            if len(recent) < 3 or len(previous) < 3:
                continue

            delta = np.mean(recent) - np.mean(previous)
            deltas[metric] = {
                "delta": delta,
                "recent_avg": np.mean(recent),
                "previous_avg": np.mean(previous),
                "direction": "improved" if delta > 0 else "declined" if delta < 0 else "stable"
            }

        return deltas
```

---

## 9. 파라미터 요약 (Parameter Summary)

| 파라미터 | 값 | 설명 |
|---|---|---|
| **개선 감지** | | |
| `IMPROVE_ABS_THRESHOLD` | 3.0 | 절대 개선 임계값 (MA_7 기준) |
| `IMPROVE_REL_THRESHOLD` | 0.05 | 상대 개선 임계값 (5%) |
| `IMPROVE_CONSECUTIVE_DAYS` | 5 | 연속 개선 일수 |
| `IMPROVE_STAT_ALPHA` | 0.05 | 통계적 유의수준 |
| `IMPROVE_MIN_EFFECT_SIZE` | 0.3 | 최소 Cohen's d |
| `IMPROVE_MIN_PERSISTENCE` | 5 | 최소 지속 일수 |
| **악화 감지** | | |
| `DECLINE_L1_THRESHOLD` | 2.0 | Level 1 임계값 (MA_3 기준) |
| `DECLINE_L2_THRESHOLD` | 3.0 | Level 2 임계값 (MA_7 기준) |
| `DECLINE_L2_CONSEC_DAYS` | 3 | Level 2 연속 declining 일수 |
| `DECLINE_L3_ALPHA` | 0.10 | Level 3 유의수준 (더 민감) |
| `DECLINE_L3_EFFECT_SIZE` | 0.5 | Level 3 최소 Cohen's d |
| `DECLINE_METRIC_REL_THRESHOLD` | 0.10 | 개별 지표 악화 임계값 (10%) |
| **이상치** | | |
| `ANOMALY_Z_THRESHOLD` | 2.5 | z-score 이상치 임계값 |
| **제품 영향** | | |
| `IMPACT_W_TEMPORAL` | 0.4 | 시간 상관 가중치 |
| `IMPACT_W_INGREDIENT` | 0.35 | 성분 관련 가중치 |
| `IMPACT_W_HISTORICAL` | 0.25 | 히스토리 가중치 |
| `IMPACT_SIGMA_LAG` | 7 | 효과 발현 시간 표준편차 (일) |
| `IMPACT_MIN_PROBABILITY` | 0.2 | 최소 영향 가능성 표시 기준 |
| **알림** | | |
| `MAX_DAILY_NOTIFICATIONS` | 3 | 일일 최대 알림 수 |
| `MAX_WEEKLY_NOTIFICATIONS` | 7 | 주간 최대 알림 수 |
| `COOLDOWN_IMPROVEMENT` | 7일 | 개선 알림 쿨다운 |
| `COOLDOWN_L1` | 3일 | L1 주의 쿨다운 |
| `COOLDOWN_L2` | 7일 | L2 경고 쿨다운 |
| `COOLDOWN_L3` | 24시간 | L3 심각 쿨다운 |
| **종합 판단** | | |
| `CONCORDANCE_HIGH` | 0.8 | 강한 일치도 기준 |
| `CONCORDANCE_MED` | 0.6 | 보통 일치도 기준 |
| `STABLE_THRESHOLD` | 0.02 | 안정 판단 기준 (2% 미만 변화) |

---

## 10. 향후 개선 방향

### 10.1 Phase 2: 예측 기반 감지

현재는 **사후 감지**(이미 발생한 변화 감지)이지만, 충분한 데이터가 축적되면 **예측 감지**로 발전할 수 있다:

- **Time Series Forecasting**: ARIMA, Prophet, LSTM 등으로 피부 점수 예측
- **예측 기반 조기 경고**: "현재 추세가 계속되면 2주 후 피부 점수가 X점까지 하락할 수 있어요"
- **제품 효과 예측**: "이 제품을 4주 사용하면 모공 점수가 Y% 개선될 것으로 예측합니다"

### 10.2 Phase 3: 사용자 피드백 루프

감지 결과에 대한 사용자 피드백을 수집하여 알고리즘을 개선한다:

- "이 알림이 도움이 되었나요?" (thumbs up/down)
- 사용자 체감과 알고리즘 판단의 일치율 추적
- 개인별 임계값 자동 조정 (Adaptive Thresholding)

### 10.3 외부 데이터 연동

환경 데이터(미세먼지, UV 지수, 기온/습도)를 연동하면 노이즈 제거 정확도가 향상된다:

- 기상청 API: 기온, 습도
- 환경부 API: 미세먼지 (PM2.5, PM10)
- 기상청: UV 지수
