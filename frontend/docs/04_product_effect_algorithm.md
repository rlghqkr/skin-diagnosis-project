# 04. Product Effect Tracking Algorithm - 화장품 효과 추적 알고리즘

## 1. 알고리즘 개요 (Algorithm Overview)

### 1.1 핵심 질문
> "이 화장품이 실제로 내 피부 개선에 도움이 되었는가?"

이 질문에 데이터 기반으로 답하기 위해, 사용자의 피부 측정 시계열 데이터와 제품 사용 이력을 교차 분석하여 **인과 관계에 가까운 상관 관계**를 추정한다. 완벽한 인과 추론은 통제된 실험(RCT) 없이는 불가능하므로, 본 알고리즘은 관찰 데이터(observational data)에서 최대한 신뢰할 수 있는 효과 추정치를 산출하는 것을 목표로 한다.

### 1.2 알고리즘 파이프라인

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. Baseline │───>│  2. Pre/Post │───>│  3. Noise    │───>│  4. Effect   │
│  Estimation  │    │  Comparison  │    │  Removal     │    │  Score Calc  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│  7. Multi-   │<───│  6. Signif.  │<───│  5. Moving   │<───────────┘
│  Product Sep │    │  Testing     │    │  Average     │
└──────────────┘    └──────────────┘    └──────────────┘
        │
        ▼
┌──────────────┐
│  Final       │
│  Effect      │
│  Report      │
└──────────────┘
```

### 1.3 데이터 소스 (Data Model 참조)

| 테이블 | 역할 | 핵심 필드 |
|---|---|---|
| `daily_skin_scores` | 일일 피부 점수 시계열 | `overall_score`, `hydration_norm`, `elasticity_norm`, `pore_norm`, `wrinkle_norm`, `pigmentation_norm`, `ma_7_score` |
| `product_usage_history` | 제품 사용 기간 추적 | `start_date`, `end_date`, `frequency`, `is_active` |
| `skin_measurements` | 원본 측정 데이터 | `hydration_score`, `elasticity_score`, `pore_score`, `wrinkle_score`, `pigmentation_score` |
| `skincare_routines` | 루틴 기록 | `steps` (JSONB, 제품 사용 상세) |
| `products` | 제품 성분 정보 | `key_ingredients`, `category` |
| `product_effect_analyses` | 분석 결과 저장 | `effect_score`, `metric_deltas`, `confidence_level` |

---

## 2. Baseline 피부 상태 산정 (Baseline Skin State Estimation)

### 2.1 Baseline 정의

Baseline이란 특정 제품 사용을 시작하기 **직전**의 안정적인 피부 상태를 의미한다. 이 값은 제품 효과를 측정하는 기준점(reference point)이 된다.

### 2.2 Baseline Window 설정

```
Timeline:
  ←───── baseline_window ─────→←── product usage period ──→
  [  t_start_bl ... t_end_bl  ][ t_product_start ...      ]
  [     14일 (기본값)          ]
```

- **기본 baseline 기간**: 제품 사용 시작일(`start_date`) 기준 **이전 14일**
- **최소 baseline 기간**: 7일 (7일 미만이면 분석 불가 판정)
- **최대 baseline 기간**: 28일 (오래된 데이터의 관련성 감소)

### 2.3 Baseline 산출 공식

각 피부 지표 $m$에 대해 baseline 값을 산출한다:

$$B_m = \frac{1}{|W_b|} \sum_{t \in W_b} s_m(t) \quad \text{(Trimmed Mean)}$$

여기서:
- $W_b$: baseline window 내 측정일 집합
- $s_m(t)$: 날짜 $t$에서의 지표 $m$의 정규화 점수
- $|W_b|$: baseline 기간의 유효 측정 횟수

**이상치 제거된 Trimmed Mean 사용:**

$$B_m^{trimmed} = \text{TrimmedMean}(S_m^{bl}, \alpha=0.1)$$

상위/하위 10%를 제거하여 일시적 이상치의 영향을 최소화한다.

### 2.4 Baseline 안정성 검증

Baseline이 유효하려면 해당 기간의 피부 상태가 **안정적**이어야 한다:

$$\text{CV}(S_m^{bl}) = \frac{\sigma(S_m^{bl})}{\mu(S_m^{bl})} < \tau_{cv}$$

- $\tau_{cv} = 0.15$ (변동 계수 threshold)
- CV가 threshold를 초과하면 baseline이 불안정한 것으로 판단하여 분석 신뢰도를 감산한다.

### 2.5 Pseudocode

```python
def compute_baseline(user_id, product_id, metric):
    """
    제품 사용 시작 전 baseline 피부 상태를 산출한다.
    """
    usage = get_product_usage(user_id, product_id)
    product_start = usage.start_date

    # Baseline window: 시작일 전 14일 (최소 7일)
    bl_end = product_start - timedelta(days=1)
    bl_start = product_start - timedelta(days=14)

    scores = query_daily_skin_scores(
        user_id=user_id,
        metric=metric,
        date_from=bl_start,
        date_to=bl_end
    )

    if len(scores) < 5:  # 최소 5개 데이터 포인트 필요
        raise InsufficientDataError("Baseline 데이터 부족")

    # Trimmed mean (상하위 10% 제거)
    baseline_value = trimmed_mean(scores, proportiontocut=0.1)

    # 안정성 검증
    cv = np.std(scores) / np.mean(scores) if np.mean(scores) != 0 else float('inf')
    is_stable = cv < 0.15

    return BaselineResult(
        value=baseline_value,
        std=np.std(scores),
        cv=cv,
        is_stable=is_stable,
        sample_count=len(scores),
        period_start=bl_start,
        period_end=bl_end
    )
```

---

## 3. 제품 사용 전/후 비교 로직 (Before/After Comparison Logic)

### 3.1 비교 기간 설정

```
                 Before Period          After Period
              ←──────────────→      ←──────────────→
Timeline: ...─┤  baseline_win  ├────┤  effect_win   ├─...
              t_bl_start    t_bl_end  t_prod_start   t_eval
              (start-14d)  (start-1d)  (start)       (start+28d)
```

| 기간 | 기본값 | 최소값 | 최대값 | 설명 |
|---|---|---|---|---|
| Before Period | 14일 | 7일 | 28일 | 제품 사용 전 baseline |
| Buffer Period | 0~7일 | - | 7일 | 제품 적응 기간 (선택적) |
| After Period | 28일 | 14일 | 84일 | 제품 사용 후 효과 관측 |

### 3.2 Buffer Period (적응 기간)

새 제품 도입 직후에는 피부가 적응하는 과도기가 존재할 수 있다. 특히 레티놀, AHA/BHA 등 활성 성분은 초기 2주간 "purging" 현상이 발생할 수 있다.

```python
BUFFER_DAYS = {
    "retinol": 14,        # 레티놀: 2주 적응기
    "aha_bha": 7,         # 산성 각질제거제: 1주
    "vitamin_c": 3,       # 비타민C: 3일
    "default": 0          # 일반 보습제 등: 적응기 없음
}
```

제품의 `key_ingredients`에서 활성 성분을 확인하여 buffer period를 자동 결정한다.

### 3.3 Before/After 비교 공식

각 지표 $m$에 대해:

$$\Delta_m^{raw} = \bar{A}_m - \bar{B}_m$$

여기서:
- $\bar{B}_m = \text{TrimmedMean}(S_m^{before}, 0.1)$: Before 기간의 지표 $m$ 평균
- $\bar{A}_m = \text{TrimmedMean}(S_m^{after}, 0.1)$: After 기간의 지표 $m$ 평균

**방향 보정 (Direction Correction):**

일부 지표는 값이 낮을수록 좋다 (예: 모공 크기, 주름 깊이):

$$\Delta_m^{corrected} = \Delta_m^{raw} \times d_m$$

| 지표 | 방향 ($d_m$) | 설명 |
|---|---|---|
| `hydration_norm` | +1 | 높을수록 좋음 (수분) |
| `elasticity_norm` | +1 | 높을수록 좋음 (탄력) |
| `pore_norm` | +1 | 정규화 후 높을수록 좋음 |
| `wrinkle_norm` | +1 | 정규화 후 높을수록 좋음 |
| `pigmentation_norm` | +1 | 정규화 후 높을수록 좋음 |

> **참고**: `daily_skin_scores` 테이블의 `_norm` 필드들은 이미 0~1 범위로 정규화되어 있으며, 모든 지표가 "높을수록 좋음" 방향으로 통일되어 있다.

### 3.4 정규화된 변화량 (Normalized Delta)

지표 간 스케일 차이를 보정하기 위해 baseline 대비 변화율을 산출한다:

$$\Delta_m^{norm} = \frac{\Delta_m^{corrected}}{B_m + \epsilon}$$

여기서 $\epsilon = 0.01$ (zero division 방지).

### 3.5 Pseudocode

```python
def compare_before_after(user_id, product_id, metrics):
    """
    제품 사용 전/후의 피부 지표를 비교한다.
    """
    usage = get_product_usage(user_id, product_id)
    product = get_product(product_id)
    buffer_days = get_buffer_days(product.key_ingredients)

    # 기간 설정
    before_start = usage.start_date - timedelta(days=14)
    before_end = usage.start_date - timedelta(days=1)
    after_start = usage.start_date + timedelta(days=buffer_days)
    after_end = min(
        usage.end_date or date.today(),
        usage.start_date + timedelta(days=28 + buffer_days)
    )

    results = {}
    for metric in metrics:
        before_scores = query_daily_skin_scores(
            user_id, metric, before_start, before_end
        )
        after_scores = query_daily_skin_scores(
            user_id, metric, after_start, after_end
        )

        if len(before_scores) < 5 or len(after_scores) < 5:
            results[metric] = MetricDelta(status="insufficient_data")
            continue

        before_avg = trimmed_mean(before_scores, 0.1)
        after_avg = trimmed_mean(after_scores, 0.1)

        raw_delta = after_avg - before_avg
        norm_delta = raw_delta / (before_avg + 0.01)

        direction = "improved" if raw_delta > 0 else "declined" if raw_delta < 0 else "unchanged"

        results[metric] = MetricDelta(
            before_avg=before_avg,
            after_avg=after_avg,
            delta=raw_delta,
            normalized_delta=norm_delta,
            direction=direction
        )

    return results
```

---

## 4. Moving Average 적용 방법 (Moving Average Application)

### 4.1 목적

일일 피부 점수는 측정 조건(조명, 각도, 수면 상태 등)에 따라 높은 일간 변동성(daily variance)을 보인다. Moving Average(이동 평균)를 적용하여 이러한 노이즈를 평활화(smoothing)하고, 진정한 피부 상태 추세를 추출한다.

### 4.2 이동 평균 유형

#### 4.2.1 Simple Moving Average (SMA)

$$\text{SMA}_k(t) = \frac{1}{k} \sum_{i=0}^{k-1} s(t-i)$$

- $k = 7$ (7일 이동 평균, 기본값)
- 장점: 계산이 단순하고 직관적
- 단점: 모든 데이터 포인트에 동일한 가중치

#### 4.2.2 Exponential Moving Average (EMA)

$$\text{EMA}(t) = \alpha \cdot s(t) + (1 - \alpha) \cdot \text{EMA}(t-1)$$

- $\alpha = \frac{2}{k+1}$ (smoothing factor, $k=7$이면 $\alpha = 0.25$)
- 장점: 최근 데이터에 더 높은 가중치 부여
- 단점: 초기값 설정에 민감

#### 4.2.3 Weighted Moving Average (WMA) - 권장

$$\text{WMA}_k(t) = \frac{\sum_{i=0}^{k-1} w_i \cdot s(t-i)}{\sum_{i=0}^{k-1} w_i}$$

가중치 설계:

$$w_i = \frac{k - i}{k} \cdot q_i$$

여기서:
- $\frac{k-i}{k}$: 시간 가중치 (최근 데이터가 더 중요)
- $q_i$: 측정 품질 가중치 (`capture_metadata`의 이미지 품질 점수 기반)

### 4.3 결측값 처리 (Missing Data Handling)

사용자가 매일 측정하지 않을 수 있으므로 결측값 처리가 필수적이다:

```python
def weighted_moving_average(scores, dates, window=7):
    """
    결측값을 고려한 가중 이동 평균.
    측정되지 않은 날짜는 건너뛰고, 가용 데이터만으로 계산한다.
    """
    result = []
    for t_idx, t_date in enumerate(dates):
        window_start = t_date - timedelta(days=window - 1)
        window_scores = [
            (s, d) for s, d in zip(scores, dates)
            if window_start <= d <= t_date
        ]

        if len(window_scores) < 3:  # 최소 3개 데이터 필요
            result.append(None)  # 이동 평균 계산 불가
            continue

        weighted_sum = 0
        weight_sum = 0
        for score, score_date in window_scores:
            days_ago = (t_date - score_date).days
            weight = (window - days_ago) / window  # 시간 가중치
            weighted_sum += score * weight
            weight_sum += weight

        result.append(weighted_sum / weight_sum)

    return result
```

### 4.4 다중 윈도우 적용

분석 목적에 따라 다른 윈도우 크기를 사용한다:

| 윈도우 | 크기 | 용도 |
|---|---|---|
| `MA_3` | 3일 | 단기 변동 감지 (급격한 악화 감지) |
| `MA_7` | 7일 | 주간 추세 파악 (기본 평활화) - `daily_skin_scores.ma_7_score` |
| `MA_14` | 14일 | 제품 효과 비교 시 사용 (변동 최소화) |
| `MA_28` | 28일 | 장기 추세 파악 (월간 트렌드) |

### 4.5 효과 분석 시 MA 활용

제품 효과 비교에는 **MA_14**를 사용하여 일간 변동의 영향을 최소화한다:

$$\Delta_m^{MA} = \text{MA}_{14}(\text{After Period 종료 시점}) - \text{MA}_{14}(\text{Before Period 종료 시점})$$

---

## 5. 외부 노이즈 제거 방법 (External Noise Removal)

### 5.1 노이즈 요인 분류

피부 상태에 영향을 미치는 외부 요인들을 식별하고 그 영향을 제거해야 한다:

| 요인 | 주기성 | 영향 크기 | 데이터 소스 |
|---|---|---|---|
| **계절 (Season)** | 연간 | 높음 | 날짜 기반 추정 |
| **수면 (Sleep)** | 일간 | 중간 | 사용자 입력 (선택) |
| **스트레스 (Stress)** | 비주기 | 중간 | 사용자 입력 (선택) |
| **생리 주기 (Menstrual)** | 월간 | 높음 (해당 시) | 사용자 입력 (선택) |
| **식단 (Diet)** | 비주기 | 낮음 | 사용자 입력 (선택) |
| **환경 (UV/미세먼지)** | 일간 | 중간 | 외부 API (향후 연동) |
| **측정 오차 (Measurement)** | 무작위 | 중간 | `capture_metadata` |

### 5.2 계절 변동 제거 (Seasonal Decomposition)

피부 상태는 계절에 따라 체계적으로 변한다 (겨울: 건조, 여름: 유분 증가). 이 계절 성분을 제거한다.

#### 방법: Additive Seasonal Decomposition

$$s(t) = T(t) + S(t) + R(t)$$

- $T(t)$: Trend (추세 성분)
- $S(t)$: Seasonal (계절 성분)
- $R(t)$: Residual (잔차 = 진짜 변화 + 제품 효과)

**계절 보정 계수 (Seasonal Adjustment Factor):**

사용자의 과거 1년 데이터가 있는 경우:

$$S_m(\text{month}) = \bar{s}_m(\text{month}) - \bar{s}_m(\text{year})$$

사용자 데이터가 부족한 경우, 전체 사용자 집단의 **피부 유형별 계절 평균**을 사용한다:

```python
# 피부 유형별 계절 보정 계수 (사전 계산된 룩업 테이블)
SEASONAL_FACTORS = {
    "dry": {
        "hydration": {1: -0.08, 2: -0.06, 3: -0.02, 4: 0.01, 5: 0.04, 6: 0.06,
                      7: 0.05, 8: 0.04, 9: 0.02, 10: -0.01, 11: -0.04, 12: -0.07},
        "elasticity": { ... },
        ...
    },
    "oily": { ... },
    "combination": { ... },
    ...
}

def remove_seasonal_effect(score, metric, month, skin_type):
    """계절 성분을 제거한 조정 점수를 반환한다."""
    seasonal_factor = SEASONAL_FACTORS.get(skin_type, {}).get(metric, {}).get(month, 0)
    return score - seasonal_factor
```

### 5.3 측정 오차 보정 (Measurement Error Correction)

`skin_measurements.capture_metadata`에 기록된 촬영 환경 정보를 기반으로 측정 오차를 보정한다:

```json
// capture_metadata 예시
{
  "lighting": "natural",      // natural | artificial | mixed
  "lighting_score": 0.85,     // 0~1, 조명 품질 점수
  "face_angle": 2.3,          // 정면 대비 각도 (도)
  "image_quality": 0.92,      // 0~1, 이미지 선명도
  "device": "iPhone15Pro"
}
```

**품질 가중치 산출:**

$$q(t) = \min(\text{lighting\_score}(t), \text{image\_quality}(t)) \times \mathbb{1}[\text{face\_angle}(t) < 15°]$$

품질이 낮은 측정($q < 0.5$)은 분석에서 제외하거나 가중치를 낮춘다.

### 5.4 자연적 피부 변동 추정 (Natural Skin Variance)

제품을 사용하지 않더라도 피부 상태는 자연적으로 변동한다. 이 "자연 변동폭"을 추정하여 제품 효과에서 차감해야 한다.

$$\sigma_{natural,m} = \text{MAD}(S_m^{baseline}) \times 1.4826$$

- MAD: Median Absolute Deviation (이상치에 강건한 표준편차 추정)
- $1.4826$: MAD를 정규분포 표준편차로 변환하는 상수

**Natural Variance Band:**

$$\text{NVB}_m = [-2\sigma_{natural,m}, +2\sigma_{natural,m}]$$

이 범위 내의 변화는 "자연 변동"으로 간주하고, 이 범위를 벗어나는 변화만 제품 효과 후보로 판단한다.

### 5.5 종합 노이즈 제거 파이프라인

```python
def remove_noise(raw_scores, user_id, metric, dates):
    """
    외부 노이즈를 제거한 보정 점수를 산출한다.
    """
    user = get_user(user_id)

    adjusted_scores = []
    for score, date in zip(raw_scores, dates):
        # 1. 측정 품질 필터링
        quality = get_measurement_quality(user_id, date)
        if quality < 0.5:
            continue  # 저품질 측정 제외

        # 2. 계절 보정
        s_adj = remove_seasonal_effect(score, metric, date.month, user.skin_type)

        # 3. 품질 가중치 적용
        adjusted_scores.append((s_adj, quality, date))

    return adjusted_scores
```

---

## 6. Product Effect Score 공식 상세 설계

### 6.1 핵심 공식 (Core Formula)

$$\text{PES}_{p,u} = \left( \sum_{m \in M} w_m \cdot \text{AdjDelta}_m \right) \times C_{total} \times 100$$

여기서:
- $\text{PES}_{p,u}$: 사용자 $u$에 대한 제품 $p$의 Product Effect Score ($-100$ ~ $+100$)
- $M$: 피부 지표 집합 {hydration, elasticity, pore, wrinkle, pigmentation}
- $w_m$: 지표별 가중치 (사용자 피부 고민 기반 조정)
- $\text{AdjDelta}_m$: 노이즈 제거된 보정 변화량
- $C_{total}$: 종합 신뢰도 계수

### 6.2 보정 변화량 (Adjusted Delta)

$$\text{AdjDelta}_m = \text{clip}\left(\frac{\Delta_m^{MA} - S_m(\text{month})}{B_m + \epsilon}, -1, 1\right)$$

단계별 분해:

1. **Raw Delta**: $\Delta_m^{raw} = \bar{A}_m - \bar{B}_m$
2. **계절 보정**: $\Delta_m^{seasonal} = \Delta_m^{raw} - S_m(\text{month})$
3. **MA 평활화**: MA_14 적용된 값으로 Before/After 비교
4. **정규화**: Baseline 대비 비율로 변환
5. **Clipping**: $[-1, +1]$ 범위로 제한 (극단값 방지)

### 6.3 지표별 가중치 (Metric Weights)

#### 6.3.1 기본 가중치 (Default Weights)

| 지표 | 기본 가중치 ($w_m^{default}$) |
|---|---|
| hydration | 0.25 |
| elasticity | 0.20 |
| pore | 0.20 |
| wrinkle | 0.20 |
| pigmentation | 0.15 |

#### 6.3.2 사용자 맞춤 가중치 (Personalized Weights)

사용자의 `skin_concerns`(피부 고민)와 제품의 `target_concerns`(타겟 효능)를 기반으로 가중치를 조정한다:

$$w_m = w_m^{default} \times (1 + \beta \cdot \mathbb{1}[m \in \text{user\_concerns}]) \times (1 + \gamma \cdot \mathbb{1}[m \in \text{product\_targets}])$$

- $\beta = 0.3$: 사용자 관심 지표 가중치 부스트
- $\gamma = 0.5$: 제품 타겟 지표 가중치 부스트

정규화: $w_m \leftarrow \frac{w_m}{\sum_m w_m}$ (합이 1이 되도록)

```python
def compute_personalized_weights(user, product):
    """사용자 피부 고민 + 제품 타겟에 기반한 맞춤 가중치."""
    DEFAULT_WEIGHTS = {
        "hydration": 0.25, "elasticity": 0.20,
        "pore": 0.20, "wrinkle": 0.20, "pigmentation": 0.15
    }

    CONCERN_TO_METRIC = {
        "dryness": "hydration", "sagging": "elasticity",
        "pore": "pore", "wrinkle": "wrinkle", "pigmentation": "pigmentation"
    }

    user_concerns = set(user.skin_concerns or [])
    product_targets = set()
    for ing in (product.key_ingredients or []):
        product_targets.update(ing.get("target_concerns", []))

    weights = {}
    for metric, default_w in DEFAULT_WEIGHTS.items():
        w = default_w
        # 사용자 관심 지표 부스트
        if any(CONCERN_TO_METRIC.get(c) == metric for c in user_concerns):
            w *= 1.3
        # 제품 타겟 지표 부스트
        if any(CONCERN_TO_METRIC.get(c) == metric for c in product_targets):
            w *= 1.5
        weights[metric] = w

    # 정규화
    total = sum(weights.values())
    return {m: w / total for m, w in weights.items()}
```

### 6.4 종합 신뢰도 계수 (Total Confidence Coefficient)

$$C_{total} = C_{sample} \times C_{duration} \times C_{consistency} \times C_{stability}$$

| 요소 | 공식 | 범위 | 설명 |
|---|---|---|---|
| $C_{sample}$ | $\min\left(\frac{n_{before} + n_{after}}{n_{min}}, 1\right)$ | 0~1 | 샘플 수 충분성 |
| $C_{duration}$ | $\min\left(\frac{d_{usage}}{d_{min}}, 1\right)$ | 0~1 | 사용 기간 충분성 |
| $C_{consistency}$ | $\frac{n_{routine\_recorded}}{n_{total\_days}}$ | 0~1 | 루틴 기록 일관성 |
| $C_{stability}$ | $1 - \min\left(\frac{\text{CV}_{baseline}}{0.3}, 1\right)$ | 0~1 | Baseline 안정성 |

기본 파라미터:
- $n_{min} = 20$ (최소 필요 샘플 수: before 10 + after 10)
- $d_{min} = 28$ (최소 사용 기간: 28일)

### 6.5 최종 Effect Score 산출 Pseudocode

```python
def compute_product_effect_score(user_id, product_id):
    """
    제품 효과 점수(PES)를 산출한다.
    결과를 product_effect_analyses 테이블에 저장한다.
    """
    user = get_user(user_id)
    product = get_product(product_id)
    usage = get_product_usage(user_id, product_id)
    metrics = ["hydration_norm", "elasticity_norm", "pore_norm",
               "wrinkle_norm", "pigmentation_norm"]

    # 1. 맞춤 가중치 산출
    weights = compute_personalized_weights(user, product)

    # 2. 각 지표별 보정 변화량 산출
    metric_deltas = {}
    for metric in metrics:
        baseline = compute_baseline(user_id, product_id, metric)
        comparison = compare_before_after(user_id, product_id, [metric])

        if comparison[metric].status == "insufficient_data":
            continue

        # 계절 보정
        month_midpoint = (usage.start_date.month + (usage.end_date or date.today()).month) // 2
        seasonal_adj = SEASONAL_FACTORS.get(user.skin_type, {}).get(metric, {}).get(month_midpoint, 0)

        raw_delta = comparison[metric].delta
        adj_delta = (raw_delta - seasonal_adj) / (baseline.value + 0.01)
        adj_delta = max(-1.0, min(1.0, adj_delta))  # clipping

        metric_deltas[metric] = {
            "before_avg": comparison[metric].before_avg,
            "after_avg": comparison[metric].after_avg,
            "delta": raw_delta,
            "adj_delta": adj_delta,
            "seasonal_adjustment": seasonal_adj,
            "direction": comparison[metric].direction
        }

    # 3. 신뢰도 산출
    before_count = get_sample_count(user_id, before_period)
    after_count = get_sample_count(user_id, after_period)
    usage_days = (usage.end_date or date.today()) - usage.start_date
    routine_consistency = get_routine_consistency(user_id, usage.start_date, usage.end_date)
    baseline_cv = max(b.cv for b in baselines.values())

    C_sample = min((before_count + after_count) / 20, 1.0)
    C_duration = min(usage_days.days / 28, 1.0)
    C_consistency = routine_consistency
    C_stability = 1 - min(baseline_cv / 0.3, 1.0)
    C_total = C_sample * C_duration * C_consistency * C_stability

    # 4. PES 산출
    weighted_sum = sum(
        weights.get(m.replace("_norm", ""), 0) * d["adj_delta"]
        for m, d in metric_deltas.items()
    )
    pes = weighted_sum * C_total * 100
    pes = max(-100, min(100, pes))  # 최종 범위 제한

    # 5. 결과 저장
    save_product_effect_analysis(
        user_id=user_id,
        product_id=product_id,
        analysis_period_start=usage.start_date - timedelta(days=14),
        analysis_period_end=usage.end_date or date.today(),
        effect_score=pes,
        metric_deltas=metric_deltas,
        confidence_level=C_total,
        usage_duration_days=usage_days.days,
        before_avg_score=mean(d["before_avg"] for d in metric_deltas.values()),
        after_avg_score=mean(d["after_avg"] for d in metric_deltas.values()),
        sample_count=before_count + after_count,
        analysis_version="1.0"
    )

    return ProductEffectResult(
        effect_score=pes,
        metric_deltas=metric_deltas,
        confidence=C_total,
        interpretation=interpret_score(pes, C_total)
    )
```

### 6.6 Effect Score 해석 (Interpretation)

| PES 범위 | 해석 | UI 표시 |
|---|---|---|
| $+30$ ~ $+100$ | 뚜렷한 개선 효과 | "이 제품이 피부 개선에 도움이 되고 있어요!" |
| $+10$ ~ $+30$ | 경미한 개선 | "약간의 개선 효과가 관찰됩니다" |
| $-10$ ~ $+10$ | 변화 없음 / 판단 불가 | "뚜렷한 변화가 감지되지 않았어요" |
| $-30$ ~ $-10$ | 경미한 악화 | "피부 상태가 약간 나빠진 것 같아요" |
| $-100$ ~ $-30$ | 뚜렷한 악화 | "이 제품이 피부에 맞지 않을 수 있어요" |

신뢰도가 낮은 경우($C_{total} < 0.5$):

| 신뢰도 | 추가 메시지 |
|---|---|
| $0.3$ ~ $0.5$ | "아직 데이터가 충분하지 않아 참고용으로만 활용해주세요" |
| $< 0.3$ | "더 많은 측정 데이터가 필요합니다 (현재 N일/최소 28일)" |

---

## 7. 통계적 유의성 검증 (Statistical Significance Testing)

### 7.1 검증 목적

Before/After 차이가 단순한 우연(random chance)이 아니라 통계적으로 유의미한 변화인지를 검증한다.

### 7.2 검증 방법: Welch's t-test

두 기간(Before, After)의 평균이 통계적으로 다른지를 검증한다.

$$t = \frac{\bar{A}_m - \bar{B}_m}{\sqrt{\frac{s_A^2}{n_A} + \frac{s_B^2}{n_B}}}$$

- $H_0$: $\mu_A = \mu_B$ (제품 사용 전후 차이 없음)
- $H_1$: $\mu_A \neq \mu_B$ (차이 있음)
- 유의수준: $\alpha = 0.05$

Welch's t-test를 선택한 이유:
- 두 그룹의 분산이 다를 수 있음 (Before/After 기간의 변동성 차이)
- 두 그룹의 샘플 수가 다를 수 있음

### 7.3 Effect Size (Cohen's d)

통계적 유의성만으로는 실질적 의미를 판단하기 어려우므로, 효과 크기(effect size)도 함께 산출한다:

$$d = \frac{\bar{A}_m - \bar{B}_m}{s_{pooled}}$$

$$s_{pooled} = \sqrt{\frac{(n_A - 1)s_A^2 + (n_B - 1)s_B^2}{n_A + n_B - 2}}$$

| Cohen's d | 해석 |
|---|---|
| $|d| < 0.2$ | 무시할 수준 (negligible) |
| $0.2 \leq |d| < 0.5$ | 작은 효과 (small) |
| $0.5 \leq |d| < 0.8$ | 중간 효과 (medium) |
| $|d| \geq 0.8$ | 큰 효과 (large) |

### 7.4 다중 비교 보정 (Multiple Comparison Correction)

5개 지표를 동시에 검증하므로, 1종 오류(false positive)가 증가한다. Bonferroni-Holm 보정을 적용한다:

```python
def test_significance(before_scores, after_scores, metrics, alpha=0.05):
    """
    각 지표별 통계적 유의성을 검증하고,
    다중 비교 보정을 적용한다.
    """
    results = []

    for metric in metrics:
        b = before_scores[metric]
        a = after_scores[metric]

        # Welch's t-test
        t_stat, p_value = scipy.stats.ttest_ind(a, b, equal_var=False)

        # Cohen's d
        pooled_std = np.sqrt(
            ((len(a)-1)*np.var(a, ddof=1) + (len(b)-1)*np.var(b, ddof=1))
            / (len(a) + len(b) - 2)
        )
        cohens_d = (np.mean(a) - np.mean(b)) / pooled_std if pooled_std > 0 else 0

        results.append({
            "metric": metric,
            "t_stat": t_stat,
            "p_value": p_value,
            "cohens_d": cohens_d,
            "effect_size_label": classify_effect_size(cohens_d)
        })

    # Bonferroni-Holm 보정
    results.sort(key=lambda x: x["p_value"])
    for i, r in enumerate(results):
        adjusted_alpha = alpha / (len(metrics) - i)
        r["is_significant"] = r["p_value"] < adjusted_alpha
        r["adjusted_alpha"] = adjusted_alpha

    return results
```

### 7.5 최소 샘플 수 요건 (Minimum Sample Size)

통계적 검정력(power = 0.8)을 확보하기 위한 최소 샘플 수:

| 기대 효과 크기 | 유의수준 | 최소 샘플 수 (각 그룹) |
|---|---|---|
| small ($d=0.2$) | 0.05 | 393 (비현실적) |
| medium ($d=0.5$) | 0.05 | 64 |
| large ($d=0.8$) | 0.05 | 26 |

실제 서비스에서 사용자가 28일 동안 매일 측정하면 각 그룹 약 14~28개의 샘플을 확보할 수 있으므로, **large effect** 수준의 변화만 통계적으로 유의하게 감지할 수 있다.

이에 따른 전략:
- 2주 미만: 분석 불가
- 2~4주: 큰 변화만 감지 가능, 신뢰도 표시 "preliminary"
- 4~8주: 중간 변화 감지 가능, 신뢰도 표시 "moderate"
- 8주 이상: 작은 변화도 감지 가능, 신뢰도 표시 "high"

---

## 8. 다중 제품 동시 사용 시 개별 효과 분리 (Multi-Product Effect Separation)

### 8.1 문제 정의

대부분의 사용자는 동시에 여러 제품을 사용한다 (클렌저 + 토너 + 세럼 + 크림 + ...). 이 때 피부 변화가 어떤 제품의 영향인지를 분리하는 것이 핵심 과제이다.

### 8.2 접근 전략

#### 8.2.1 Strategy 1: Difference-in-Differences (이중차분법)

동시에 사용하는 다른 제품들이 일정하게 유지되는 경우, **새로 추가/제거된 제품**의 효과만 분리할 수 있다.

```
Timeline:
  Period 1 (Before):   [제품A, 제품B, 제품C] → 피부 점수 평균 = X₁
  Period 2 (After):    [제품A, 제품B, 제품C, 제품D_new] → 피부 점수 평균 = X₂

  제품D의 추정 효과 = X₂ - X₁ (다른 제품은 동일하므로)
```

**전제 조건**: 다른 제품의 사용이 before/after 기간에 동일해야 함

```python
def check_routine_stability(user_id, before_period, after_period, target_product_id):
    """
    타겟 제품 외에 다른 제품 사용이 안정적인지 확인한다.
    """
    before_products = get_active_products(user_id, before_period)
    after_products = get_active_products(user_id, after_period)

    # 타겟 제품 제외
    after_products_excl = after_products - {target_product_id}

    # 차이 계산
    added = after_products_excl - before_products
    removed = before_products - after_products_excl

    is_stable = len(added) == 0 and len(removed) == 0

    return RoutineStability(
        is_stable=is_stable,
        added_products=added,
        removed_products=removed,
        stability_score=1.0 if is_stable else max(0, 1 - 0.2 * (len(added) + len(removed)))
    )
```

#### 8.2.2 Strategy 2: 성분 기반 기여도 분배 (Ingredient-Based Attribution)

동시에 여러 제품이 변경된 경우, 각 제품의 **주요 성분**과 **변화된 지표** 간의 관련성을 기반으로 기여도를 분배한다.

```python
# 성분 → 기대 효과 매핑 (도메인 지식 기반)
INGREDIENT_EFFECT_MAP = {
    "Niacinamide":       {"pigmentation": 0.8, "pore": 0.6, "hydration": 0.3},
    "Retinol":           {"wrinkle": 0.9, "elasticity": 0.7, "pigmentation": 0.4},
    "Hyaluronic Acid":   {"hydration": 0.9, "elasticity": 0.3},
    "Salicylic Acid":    {"pore": 0.8, "wrinkle": 0.2},
    "Vitamin C":         {"pigmentation": 0.9, "elasticity": 0.4},
    "Ceramide":          {"hydration": 0.8, "elasticity": 0.5},
    "AHA":               {"pore": 0.7, "pigmentation": 0.5, "wrinkle": 0.3},
    "Peptide":           {"wrinkle": 0.8, "elasticity": 0.7},
}
```

**기여도 분배 공식:**

개선된 지표 $m$에 대해, 제품 $p$의 기여도:

$$\text{Attribution}(p, m) = \frac{\text{RelevanceScore}(p, m)}{\sum_{p' \in P_{active}} \text{RelevanceScore}(p', m)}$$

$$\text{RelevanceScore}(p, m) = \max_{i \in \text{ingredients}(p)} \text{INGREDIENT\_EFFECT\_MAP}[i][m]$$

```python
def distribute_effect_multi_product(user_id, changed_metrics, active_products):
    """
    여러 제품이 동시에 사용될 때, 각 제품의 기여도를 분배한다.
    """
    attributions = {}

    for metric, delta in changed_metrics.items():
        relevance_scores = {}

        for product in active_products:
            max_relevance = 0
            for ingredient in product.key_ingredients:
                name_en = ingredient.get("name_en", "")
                relevance = INGREDIENT_EFFECT_MAP.get(name_en, {}).get(metric, 0)
                max_relevance = max(max_relevance, relevance)
            relevance_scores[product.product_id] = max_relevance

        total_relevance = sum(relevance_scores.values())
        if total_relevance == 0:
            # 어떤 제품도 해당 지표와 관련 없으면 균등 분배
            for pid in relevance_scores:
                relevance_scores[pid] = 1.0 / len(relevance_scores)
        else:
            for pid in relevance_scores:
                relevance_scores[pid] /= total_relevance

        for pid, attribution_ratio in relevance_scores.items():
            if pid not in attributions:
                attributions[pid] = {}
            attributions[pid][metric] = {
                "delta": delta * attribution_ratio,
                "attribution_ratio": attribution_ratio,
                "confidence": "estimated"
            }

    return attributions
```

#### 8.2.3 Strategy 3: Temporal Isolation (시간적 격리)

가장 신뢰도가 높은 방법. 사용자가 한 번에 하나의 제품만 변경하도록 유도하거나, 자연스럽게 제품 변경 시점이 분리된 경우를 활용한다.

**제품 변경 이벤트 감지:**

```python
def detect_product_change_events(user_id, period_start, period_end):
    """
    기간 내 제품 변경 이벤트를 시간순으로 감지한다.
    """
    usage_history = get_product_usage_history(
        user_id, period_start, period_end
    )

    events = []
    for usage in usage_history:
        if usage.start_date >= period_start:
            events.append(ProductChangeEvent(
                date=usage.start_date,
                type="added",
                product_id=usage.product_id
            ))
        if usage.end_date and usage.end_date <= period_end:
            events.append(ProductChangeEvent(
                date=usage.end_date,
                type="removed",
                product_id=usage.product_id
            ))

    events.sort(key=lambda e: e.date)

    # 격리 구간 식별: 연속 이벤트 간 최소 14일 간격
    isolated_events = []
    for i, event in enumerate(events):
        prev_gap = (event.date - events[i-1].date).days if i > 0 else float('inf')
        next_gap = (events[i+1].date - event.date).days if i < len(events)-1 else float('inf')

        if prev_gap >= 14 and next_gap >= 14:
            isolated_events.append(event)  # 시간적으로 격리된 이벤트

    return isolated_events
```

### 8.3 종합 분리 전략 우선순위

```python
def analyze_product_effect(user_id, product_id):
    """
    제품 효과를 분석할 때, 상황에 따라 최적의 분리 전략을 선택한다.
    """
    stability = check_routine_stability(user_id, before_period, after_period, product_id)

    if stability.is_stable:
        # Strategy 1: 다른 제품이 동일하면 단순 비교 (최고 신뢰도)
        method = "difference_in_differences"
        confidence_modifier = 1.0

    elif is_temporally_isolated(user_id, product_id):
        # Strategy 3: 시간적으로 격리된 이벤트
        method = "temporal_isolation"
        confidence_modifier = 0.9

    else:
        # Strategy 2: 성분 기반 기여도 분배 (최저 신뢰도)
        method = "ingredient_attribution"
        confidence_modifier = 0.6

    effect = compute_product_effect_score(user_id, product_id)
    effect.confidence *= confidence_modifier
    effect.method = method

    return effect
```

### 8.4 다중 제품 분리 신뢰도 등급

| 상황 | 분리 방법 | 신뢰도 수준 | UI 표시 |
|---|---|---|---|
| 타겟 제품만 변경, 나머지 동일 | DiD | 높음 (0.8~1.0) | "높은 신뢰도" |
| 타겟 제품이 시간적으로 격리 | Temporal | 중간~높음 (0.7~0.9) | "신뢰할 수 있음" |
| 여러 제품 동시 변경, 성분 분리 | Ingredient | 중간 (0.4~0.7) | "추정치 (참고용)" |
| 여러 제품 동시 변경, 성분 겹침 | Ingredient (low) | 낮음 (0.2~0.4) | "데이터 부족, 한 제품만 변경 권장" |

---

## 9. 전체 알고리즘 통합 흐름 (End-to-End Flow)

```
사용자가 "제품 X 효과 분석" 요청
         │
         ▼
┌─────────────────────────────────┐
│ 1. 데이터 수집                   │
│   - product_usage_history 조회   │
│   - daily_skin_scores 조회       │
│   - skincare_routines 조회       │
│   - products 성분 정보 조회       │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 2. 데이터 유효성 검증             │
│   - 최소 사용 기간 확인 (≥14일)   │
│   - 최소 측정 횟수 확인 (≥10회)   │
│   - Baseline 가용성 확인          │
└─────────────┬───────────────────┘
              │ (유효하지 않으면 "분석 불가" 반환)
              ▼
┌─────────────────────────────────┐
│ 3. Baseline 산출                 │
│   - Trimmed Mean 계산            │
│   - 안정성 검증 (CV < 0.15)      │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 4. 노이즈 제거                   │
│   - 측정 품질 필터링              │
│   - 계절 보정                    │
│   - 이동 평균 적용 (MA_14)        │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 5. Before/After 비교             │
│   - 지표별 변화량 산출            │
│   - 정규화 및 방향 보정           │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 6. 다중 제품 분리                 │
│   - 루틴 안정성 확인              │
│   - 적절한 분리 전략 선택         │
│   - 기여도 분배                   │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 7. 통계적 유의성 검증             │
│   - Welch's t-test               │
│   - Cohen's d 효과 크기           │
│   - Bonferroni-Holm 보정         │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 8. Effect Score 산출             │
│   - 맞춤 가중치 적용              │
│   - 종합 신뢰도 산출              │
│   - PES 계산                     │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 9. 결과 저장 및 반환              │
│   - product_effect_analyses 저장  │
│   - 해석 텍스트 생성              │
│   - metric_deltas JSON 구성      │
└─────────────────────────────────┘
```

---

## 10. 알고리즘 파라미터 요약 (Parameter Summary)

| 파라미터 | 기본값 | 설명 | 조정 가능 |
|---|---|---|---|
| `BASELINE_WINDOW_DAYS` | 14 | Baseline 기간 (일) | Yes |
| `MIN_BASELINE_DAYS` | 7 | 최소 Baseline 기간 | No |
| `MAX_BASELINE_DAYS` | 28 | 최대 Baseline 기간 | No |
| `TRIMMED_PROPORTION` | 0.1 | Trimmed Mean 절삭 비율 | Yes |
| `CV_THRESHOLD` | 0.15 | Baseline 안정성 임계값 | Yes |
| `MA_WINDOW_EFFECT` | 14 | 효과 분석용 이동 평균 윈도우 | Yes |
| `MA_WINDOW_TREND` | 7 | 일반 추세용 이동 평균 윈도우 | No |
| `MIN_SAMPLES` | 5 | 그룹별 최소 데이터 포인트 | No |
| `MIN_TOTAL_SAMPLES` | 20 | 전체 최소 샘플 수 | No |
| `MIN_USAGE_DAYS` | 28 | 최소 사용 기간 (일) | No |
| `SIGNIFICANCE_ALPHA` | 0.05 | 통계적 유의수준 | Yes |
| `EPSILON` | 0.01 | Zero division 방지 상수 | No |
| `BETA_CONCERN_BOOST` | 0.3 | 사용자 관심 지표 부스트 | Yes |
| `GAMMA_TARGET_BOOST` | 0.5 | 제품 타겟 지표 부스트 | Yes |
| `MIN_ISOLATION_DAYS` | 14 | 시간적 격리 최소 간격 | Yes |
| `MEASUREMENT_QUALITY_MIN` | 0.5 | 최소 측정 품질 임계값 | Yes |

---

## 11. 향후 개선 방향 (Future Improvements)

### 11.1 Phase 2: 머신러닝 기반 효과 예측

사용자-제품 데이터가 충분히 축적되면 (10,000+ 사용자), 개인화된 효과 예측 모델을 학습할 수 있다:

- **Collaborative Filtering**: "나와 비슷한 피부의 사용자에게 효과적이었던 제품"
- **Causal Inference (인과 추론)**: Propensity Score Matching, Instrumental Variables 등
- **Time Series Forecasting**: 제품 사용 시 피부 점수 변화 궤적 예측

### 11.2 Phase 3: A/B 테스트 모드

사용자가 직접 통제된 실험을 수행할 수 있는 기능:
- 좌/우 반얼굴 테스트 (Half-face Test)
- 교대 사용 테스트 (Crossover Design)
- 실험 기간 설정 및 자동 분석

### 11.3 지속적 알고리즘 검증

- **A/A Test**: 동일 기간 반복 분석으로 false positive rate 검증
- **사용자 만족도 피드백**: 분석 결과와 사용자 체감의 일치율 추적
- **파라미터 튜닝**: 대규모 데이터 기반 최적 파라미터 탐색
