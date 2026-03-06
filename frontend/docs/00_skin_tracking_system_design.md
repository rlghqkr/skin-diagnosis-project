# NIA Skin Tracking System - 통합 설계 문서

> **스킨케어 루틴 기록 + 데일리 피부 건강 트래킹 시스템**
> AI 기반 피부 분석 및 화장품 추천 서비스 고도화
> 최종 업데이트: 2026-03-07

---

## 목차

| # | 섹션 | 문서 | 핵심 내용 |
|---|------|------|----------|
| 1 | [Product Concept](#1-product-concept) | [01_product_concept.md](./01_product_concept.md) | 서비스 비전, 가치 제안, 타겟 유저, 셀링 포인트 |
| 2 | [System Architecture](#2-system-architecture) | [02_system_architecture.md](./02_system_architecture.md) | 5개 모듈 설계, 기술 스택, 데이터 흐름 |
| 3 | [Data Model](#3-data-model) | [03_data_model.md](./03_data_model.md) | 7개 테이블 스키마, ERD, 인덱스, DDL |
| 4 | [Product Effect Algorithm](#4-product-effect-tracking-algorithm) | [04_product_effect_algorithm.md](./04_product_effect_algorithm.md) | Baseline, Before/After, Moving Average, 노이즈 제거, PES 공식 |
| 5 | [Skin Change Detection](#5-skin-change-detection-logic) | [05_skin_change_detection.md](./05_skin_change_detection.md) | 개선/악화 감지, 제품 영향 판단, 알림 로직 |
| 6 | [UX Flow](#6-ux-flow) | [06_ux_flow.md](./06_ux_flow.md) | Daily Check, Routine Logging, Trend Dashboard |
| 7 | [Differentiation Strategy](#7-differentiation-strategy) | [07_differentiation_strategy.md](./07_differentiation_strategy.md) | 기존 서비스 한계, 5대 차별점, 경쟁 우위, 데이터 모트 |
| 8 | [Data Accuracy Strategy](#8-data-accuracy-strategy) | [08_data_accuracy_strategy.md](./08_data_accuracy_strategy.md) | 8단계 신뢰도 파이프라인, 조명/얼굴 정렬/거리 보정 |
| 9 | [Long-term Data Strategy](#9-long-term-data-strategy) | [09_long_term_strategy.md](./09_long_term_strategy.md) | 개인 패턴, 계절 예측, 커뮤니티 데이터, 프라이버시 |

---

## Executive Summary

**NIA Skin Tracking System**은 "피부 건강을 몸무게처럼 매일 동일한 조건에서 측정한다"는 핵심 철학 위에 구축된, 데이터 기반 스킨케어 검증 플랫폼이다.

### 핵심 가치
- **No More Guessing**: 감에 의존하는 스킨케어에서 데이터 기반 스킨케어로
- **Your Skin, Your Lab**: 매일의 피부가 실험 데이터, 화장품이 실험 변수
- **Time Tells Truth**: 4주·8주·12주 장기 데이터가 진짜 효과를 알려줌

### 시스템 핵심 흐름

```
사용자 촬영 → AI 피부 분석 → 일일 점수 기록 → 루틴 기록
                                                    ↓
데이터 기반 추천 ← 제품 효과 분석 ← 변화 감지 ← 장기 데이터 축적
        ↑                                           ↓
        └──────────── 피드백 루프 (Closed Loop) ──────┘
```

---

## 1. Product Concept

> 상세: [01_product_concept.md](./01_product_concept.md)

### 비전
> "피부 건강을 몸무게처럼 매일 동일한 조건에서 측정하고, 데이터로 관리하는 세상"

### 핵심 가치 제안 (Value Proposition)

| 구분 | 기존 방식 | NIA |
|------|----------|-----|
| 화장품 효과 판단 | "촉촉해진 것 같아" (주관적) | "수분 +12%, 모공 -8%" (객관적 수치) |
| 추천 기반 | 리뷰 평점 4.5 (타인의 주관) | "피부 유사 유저 73%에서 효과 확인" |
| 판단 시점 | 1주 사용 후 감으로 판단 | 4주간 지표 추이 그래프로 판단 |

### 타겟 페르소나
1. **데이터 드리븐 뷰티러버** (Primary): 29세, 성분 분석에 관심, 화장품 효과를 객관적으로 확인하고 싶은 유저
2. **스킨케어 입문자** (Secondary): 25세, 정보 과잉 속 뭘 써야 할지 모르는 유저
3. **피부 관리 열성 유저** (Tertiary): 34세, 고가 스킨케어/시술 투자 대비 효과(ROI)를 확인하고 싶은 유저

### 셀링 포인트
- **Skincare Analytics**: 4주 후 제품 효과를 수치로 제공
- **Personal Skin Lab**: 내 얼굴이 실험실, Half-face Test 등 준-실험 지원
- **Crowd-Verified Recommendations**: 실제 피부 데이터 변화 기반 추천

### 비즈니스 모델
| 수익원 | 비중 |
|--------|------|
| 프리미엄 구독 | 40% |
| 어필리에이트 커머스 | 30% |
| B2B 데이터 인사이트 | 20% |
| 브랜드 광고/스폰서십 | 10% |

---

## 2. System Architecture

> 상세: [02_system_architecture.md](./02_system_architecture.md)

### 전체 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                CLIENT (React + Vite + Zustand)           │
│   Home | Analysis | Routine | Tracking | Profile         │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST API
┌──────────────────────────┴──────────────────────────────┐
│                 API GATEWAY (FastAPI)                     │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────┐ │
│  │    Skin     │ │  Routine   │ │   Product Effect     │ │
│  │ Measurement │ │  Tracker   │ │   Analysis Engine    │ │
│  └────────────┘ └────────────┘ └──────────────────────┘ │
│  ┌────────────┐ ┌──────────────────────────────────────┐ │
│  │   Score     │ │   Skin Change Visualization          │ │
│  │  Tracking   │ │                                      │ │
│  └────────────┘ └──────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────┐
│     PostgreSQL  │  Redis (Cache)  │  AI Model Server     │
└─────────────────────────────────────────────────────────┘
```

### 5개 핵심 모듈

| 모듈 | 역할 | 핵심 기능 |
|------|------|----------|
| **Skin Measurement** | AI 피부 분석 + 점수 산출 | 5대 지표 측정, 가중치 기반 종합 점수(0~100) |
| **Routine Tracker** | 루틴 기록 관리 | 아침/저녁 분리, 제품 자동완성, 템플릿, 스트릭 |
| **Product Effect Analysis** | 제품 효과 분석 | Before/After 비교, 신뢰도 기반 효과 점수(-100~+100) |
| **Score Tracking** | 일일 점수 추적 | 7일 이동 평균, 선형 회귀 추세, 이상치 탐지 |
| **Visualization** | 변화 시각화 | Recharts/D3 7종 차트, 인터랙티브 대시보드 |

### 기술 스택

| 계층 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Vite + Zustand + Recharts |
| Backend | FastAPI (Python 3.11+) + SQLAlchemy 2.0 |
| Database | PostgreSQL 15+ (JSONB) + Redis 7+ |
| AI/ML | PyTorch + ONNX Runtime |
| Auth | JWT + OAuth 2.0 |
| Deploy | Docker + AWS ECS / GCP Cloud Run |

### 확장 로드맵

| Phase | 목표 | 핵심 변경 |
|-------|------|----------|
| **MVP** | 단일 서버 | FastAPI + PostgreSQL + Redis |
| **Growth** | 읽기 분산 | Read Replica, AI 서버 분리, CDN |
| **Scale** | MSA 전환 | 모듈별 마이크로서비스, Celery, TimescaleDB |

---

## 3. Data Model

> 상세: [03_data_model.md](./03_data_model.md)

### 7개 테이블 구조

```
users ──┬──> skin_measurements ──> daily_skin_scores
        ├──> skincare_routines
        ├──> product_usage_history ──┐
        └──> product_effect_analyses <┘
                    ↑
              products ────────────┘
```

| 테이블 | 핵심 역할 | 주요 특징 |
|--------|----------|----------|
| `users` | 사용자 프로필 | skin_type, baseline_score, skin_concerns (JSONB) |
| `skin_measurements` | AI 분석 원본 | classification_data, regression_data (JSONB) |
| `skincare_routines` | 루틴 기록 | steps (JSONB), UNIQUE(user, date, time_of_day) |
| `products` | 제품 마스터 | ingredients, key_ingredients (JSONB), trigram 검색 |
| `product_usage_history` | 사용 기간 추적 | start_date/end_date, frequency, is_active |
| `daily_skin_scores` | 정규화 점수 | 5개 _norm 필드, ma_7_score, trend_direction |
| `product_effect_analyses` | 효과 분석 결과 | effect_score(-100~+100), metric_deltas (JSONB) |

### 핵심 설계 결정

- **JSONB 활용**: 루틴 steps, 성분 정보, 부위별 분석 결과 등 유연한 구조
- **22개 인덱스**: B-tree, GIN, Partial, Trigram 인덱스 최적화
- **데이터 무결성**: 하루 1회 점수 UNIQUE 제약, 사용 기간 CHECK, CASCADE/RESTRICT 삭제 정책
- **트리거**: updated_at 자동 갱신, total_products 자동 계산

---

## 4. Product Effect Tracking Algorithm

> 상세: [04_product_effect_algorithm.md](./04_product_effect_algorithm.md)

### 핵심 질문
> "이 화장품이 실제로 내 피부 개선에 도움이 되었는가?"

### 알고리즘 파이프라인

```
Baseline → Before/After 비교 → 노이즈 제거 → Effect Score → Moving Average → 유의성 검증 → 다중 제품 분리
```

### Product Effect Score (PES) 공식

$$PES = \left( \sum_{m} w_m \cdot AdjDelta_m \right) \times C_{total} \times 100$$

| 구성 요소 | 설명 |
|----------|------|
| **Baseline** | Trimmed Mean (상하위 10% 제거), CV < 0.15 안정성 검증 |
| **Before/After** | Buffer Period (레티놀 14일, AHA 7일 등), 방향 보정 + 정규화 |
| **Moving Average** | WMA 권장, 다중 윈도우 (MA_3/7/14/28), 결측값 처리 |
| **노이즈 제거** | 계절 보정(Seasonal Decomposition), 측정 오차 보정, Natural Variance Band |
| **가중치** | 사용자 피부 고민 + 제품 타겟 성분 기반 맞춤 가중치 |
| **신뢰도** | 4요소: 샘플 수 × 사용 기간 × 루틴 일관성 × Baseline 안정성 |

### 통계적 유의성
- **Welch's t-test** + **Cohen's d** 효과 크기
- **Bonferroni-Holm** 다중 비교 보정 (5개 지표 동시 검증)

### 다중 제품 분리 전략

| 우선순위 | 전략 | 신뢰도 | 조건 |
|---------|------|--------|------|
| 1 | Difference-in-Differences | 높음 | 타겟 제품만 변경, 나머지 동일 |
| 2 | Temporal Isolation | 중~높 | 제품 변경 간 14일 이상 간격 |
| 3 | Ingredient Attribution | 중간 | 여러 제품 동시 변경, 성분 기반 분배 |

---

## 5. Skin Change Detection Logic

> 상세: [05_skin_change_detection.md](./05_skin_change_detection.md)

### 3단계 감지 파이프라인

```
Daily Score → Threshold Screening → Statistical Confirmation → Contextual Analysis
```

### 감지 유형

| 유형 | 방법 | 특징 |
|------|------|------|
| **피부 개선** | 3단계 파이프라인 | Threshold + 통계 + 맥락 분석 |
| **피부 악화** | 3단계 경고 시스템 | Watch(L1) → Warning(L2) → Alert(L3), 개선보다 민감하게 |
| **제품 영향** | 종합 확률 산출 | 시간적 상관 + 성분 관련성 + 히스토리 기반 |

### 악화 감지 비대칭성
- 악화 threshold = 개선 threshold × 0.7 (더 민감하게)
- 악화 감지 시 조기 경고 → 제품 변경 권고

### 알림 제어
- **AlertThrottler**: 일/주 한도, 쿨다운, 레벨별 채널 분리
- False Positive 최소화: 다단계 확인, 이상치 배제, 최소 지속기간

### 다지표 종합 판단
- **Concordance** (방향 일치도) 기반: 3/5 이상 지표가 같은 방향이면 "종합 변화"
- 사용자 관심 지표 우선 표시

---

## 6. UX Flow

> 상세: [06_ux_flow.md](./06_ux_flow.md)

### 네비게이션 구조

```
Bottom Navigation 5탭:
[Home 홈] [Check 체크] [Routine 루틴] [Trend 트렌드] [My 프로필]
```

### 3대 핵심 플로우

#### 1) Daily Skin Check
- AR 카메라 가이드 (얼굴 윤곽 오버레이, 거리/조명/각도 인디케이터)
- 자동 촬영 → AI 분석 → 5개 지표 점수 + 레이더 차트
- Before/After 슬라이더 비교

#### 2) Skincare Routine Logging
- 아침/저녁 루틴 분리 UI
- 제품 추가: 바코드 스캔 / 텍스트 검색 / 수동 입력
- 제품 교체 플로우: 스와이프 → 교체 사유 → 히스토리 기록

#### 3) Skin Trend Dashboard
- 종합 점수 그래프 + Product Change Markers
- 5개 지표별 상세 뷰 (Hydration Timeline 등)
- 기간별 필터: 1W / 1M / 3M / 6M / 1Y
- Skin Improvement Signals (긍정 + 주의 신호)

### 추가 UX 요소
- 점수별 이모티콘/컬러 피드백 체계 (6단계)
- 8가지 마이크로 인터랙션 정의
- 6종 Push Notification 설계
- 4개 사용자 시나리오 (온보딩, 아침 루틴, 제품 교체, 트러블 대응)
- 반응형: Mobile(~767px) / Tablet(768~1023px) / Desktop(1024px~)
- 디자인 토큰: Pretendard + Inter, 시멘틱 컬러 시스템

---

## 7. Differentiation Strategy

> 상세: [07_differentiation_strategy.md](./07_differentiation_strategy.md)

### 기존 서비스 한계

| 접근 방식 | 대표 서비스 | 핵심 한계 |
|----------|-----------|----------|
| 성분 기반 추천 | 화해, CosDNA | 성분 ≠ 효과, 개인차 무시 |
| 리뷰 기반 추천 | 글로우픽, @cosme | 주관적, 플라시보, 시점 편향 |
| AI 피부 진단 | TroveSkin, VISIA | 단회성, 자사 제품 lock-in, 비표준 측정 |

### NIA 5대 차별화 요소

```
기존:  성분 정보 → 추천 → 구매 → (효과는 감으로 판단) ← 여기서 끝

NIA:   측정 → 루틴 기록 → 지속 측정 → 효과 분석 → 데이터 기반 추천
                                 ↑ 피드백 루프 (Closed Loop) ↑
```

1. **Longitudinal Skin Tracking**: 스냅샷이 아닌 타임랩스
2. **Product-Skin Causal Analysis**: "좋은 성분"이 아닌 "나에게 효과 있는 제품"
3. **Personal Skin Lab**: 수동적 소비가 아닌 능동적 실험
4. **Crowd-Verified Efficacy DB**: 별점 4.5가 아닌 "효과 확인율 71% (n=487, p<0.05)"
5. **Standardized Measurement Protocol**: 아무 때나 한 장이 아닌 매일 동일 조건 표준화

### 데이터 모트 (Data Moat)
- **개인 모트**: 6개월+ 개인 데이터 → 다른 서비스로 이동 시 처음부터
- **커뮤니티 모트**: 피부 유형별 제품 효과 DB → 규모 효과
- **생태계 모트**: 브랜드/피부과/보험사 연동 → 전환 비용 극대화

---

## 8. Data Accuracy Strategy

> 상세: [08_data_accuracy_strategy.md](./08_data_accuracy_strategy.md)

### 8단계 신뢰도 파이프라인

```
촬영 유도 → 조명 보정 → 얼굴 정렬 → 거리 보정 → 품질 검증 → 이상치 감지 → 메타데이터 기록 → 신뢰도 판정
```

| 단계 | 핵심 기술 | 목표 |
|------|----------|------|
| 1. 시간 유도 | 스마트 알림, 시간 일관성 점수 | ±1시간 이내 촬영 |
| 2. 조명 보정 | CLAHE, Color Constancy, 개인 기준선 | 5500K 표준 조명 보정 |
| 3. 얼굴 정렬 | MediaPipe 478 landmarks, Affine Transform | 동일 각도/위치 보정 |
| 4. 거리 보정 | 양 눈 간 거리 추정 (30cm 기준) | 카메라 거리 표준화 |
| 5. 품질 검증 | 블러, 노출, 화이트밸런스, 모션블러, 가림 | 저품질 이미지 필터링 |
| 6. 이상치 감지 | Z-Score + IQR + 변화율 3중 방법 | 비정상 데이터 제거 |
| 7. 메타데이터 | 촬영 조건 자동 기록 | 분석 시 보정 근거 |
| 8. 신뢰도 판정 | 5단계 분석 레벨 + 등급 시스템 | 결과 신뢰도 투명 표시 |

---

## 9. Long-term Data Strategy

> 상세: [09_long_term_strategy.md](./09_long_term_strategy.md)

### 데이터 축적에 따른 기능 로드맵

| 기간 | 가능한 분석 |
|------|-----------|
| **4주+** | 주간 패턴 (요일별 컨디션), 첫 제품 효과 분석 |
| **3개월+** | 월간 패턴 (생리 주기 등), 성분 반응 프로필 시작 |
| **6개월+** | **개인 피부 프로필(Skin DNA)** 자동 생성, 효과적 성분 TOP 5 |
| **12개월+** | 계절별 패턴 분석, 연간 피부 캘린더, 계절 전환 알림 |
| **24개월+** | 노화 패턴 분석, 장기 추세 예측 |

### 3중 추천 알고리즘
1. **Content-Based Filtering**: 개인 성분 반응 데이터 기반
2. **Collaborative Filtering**: 피부 유사 유저 그룹 기반
3. **Causal-Based Filtering**: 인과 관계 추정 기반 (PES 활용)

### 커뮤니티 데이터 활용
- 크라우드소싱 성분 효과 DB 구축 3단계
- 철저한 익명화 원칙 (k-anonymity, l-diversity)
- Edge AI: 사진은 서버 미전송, 특징 벡터만 전송

### 데이터 프라이버시
- 4단계 보호 등급 (공개 ~ 극비)
- PIPA / GDPR / CCPA 규제 준수
- 사용자 데이터 삭제권 완전 보장

---

## 모듈 간 상호 참조 매트릭스

각 설계 문서가 참조하는 다른 문서와의 의존 관계:

| 문서 | 참조하는 문서 | 참조되는 문서 |
|------|-------------|-------------|
| 01. Product Concept | - | 07 (차별화 전략) |
| 02. System Architecture | - | 03 (Data Model), 06 (UX) |
| 03. Data Model | 02 (Architecture) | 04 (Algorithm), 05 (Detection), 09 (Long-term) |
| 04. Algorithm | 03 (Data Model) | 05 (Detection) |
| 05. Detection Logic | 03 (Data Model), 04 (Algorithm) | - |
| 06. UX Flow | - | 08 (Accuracy - AR 가이드) |
| 07. Differentiation | 01 (Concept) | - |
| 08. Data Accuracy | - | 04 (Algorithm - 품질 가중치) |
| 09. Long-term | 03 (Data Model) | - |

---

## 구현 우선순위 (Implementation Priority)

### Phase 1 - MVP (8주)
- [ ] Skin Measurement Module (AI 분석 + 점수 산출)
- [ ] Daily Skin Score Tracking (일일 점수 + 7일 이동 평균)
- [ ] Daily Skin Check UX (AR 카메라 가이드 + 결과 표시)
- [ ] DB 스키마: users, skin_measurements, daily_skin_scores, products

### Phase 2 - Core Features (6주)
- [ ] Skincare Routine Tracker (루틴 기록 + 제품 검색)
- [ ] Skin Trend Dashboard (그래프 + 기간 필터)
- [ ] Data Accuracy Pipeline (조명 보정, 얼굴 정렬)
- [ ] DB 스키마: skincare_routines, product_usage_history

### Phase 3 - Intelligence (8주)
- [ ] Product Effect Analysis Engine (PES 알고리즘)
- [ ] Skin Change Detection Logic (개선/악화 감지)
- [ ] 다중 제품 효과 분리
- [ ] DB 스키마: product_effect_analyses

### Phase 4 - Growth (지속)
- [ ] 장기 데이터 분석 (개인 피부 프로필)
- [ ] 커뮤니티 데이터 기반 추천
- [ ] 계절별 예측 알림
- [ ] B2B 데이터 인사이트

---

> 본 문서는 9개 상세 설계 문서의 통합 요약본입니다.
> 각 섹션의 상세 내용(DDL, pseudocode, 와이어프레임 등)은 개별 문서를 참조하세요.
