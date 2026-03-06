# 08. Data Accuracy Strategy (데이터 신뢰도 향상 전략)

## 개요

피부 분석의 가치는 데이터 신뢰도에 직결된다. "매일 동일한 조건에서 측정"이라는 핵심 가치를 실현하기 위해, 촬영 조건 표준화부터 이상치 제거까지 8단계의 데이터 신뢰도 보장 파이프라인을 설계한다.

```
[촬영 유도] → [조명 보정] → [얼굴 정렬] → [거리 보정] → [품질 검증] → [이상치 감지] → [메타데이터 기록] → [신뢰도 판정]
```

---

## 1. 동일 시간 촬영 유도 (Time Consistency)

### 1.1 왜 시간이 중요한가?
- 피부 상태는 하루 중 시간에 따라 변화: 기상 직후(건조), 오후(유분 증가), 세안 직후(최소 유분)
- 시간 변수를 통제하지 않으면 "피부가 좋아졌다"가 "오늘은 아침에 찍었기 때문"일 수 있음
- **최적 촬영 시점**: 아침 세안 후 스킨케어 전 (Bare Skin 상태)

### 1.2 촬영 시간 유도 메커니즘

| 메커니즘 | 구현 방식 | 기대 효과 |
|---------|----------|----------|
| **스마트 알림** | 유저 설정 시간 기반 푸시 알림 (기본값: 오전 7:00) | 일상 루틴에 촬영 습관 편입 |
| **알림 최적화** | 유저의 실제 촬영 패턴 분석 → 최적 알림 시간 자동 조정 | 알림 반응률 향상 |
| **연속 기록 보상** | 연속 촬영 일수에 따른 스트릭(Streak) 배지 | 동기 부여, 습관화 |
| **시간대 표시** | 촬영 시간이 평소와 크게 다르면 경고 표시 | 이상치 사전 방지 |
| **유연한 시간 범위** | 설정 시간 ±1시간 이내 촬영을 "정상"으로 분류 | 과도한 제약 없이 일관성 유지 |

### 1.3 시간 일관성 점수 (Time Consistency Score)

```
Time Score = 1.0 - min(|촬영시간 - 기준시간| / 120분, 1.0)

예시:
- 기준 7:00, 촬영 7:10 → Score = 1.0 - (10/120) = 0.92 (우수)
- 기준 7:00, 촬영 8:30 → Score = 1.0 - (90/120) = 0.25 (주의)
- 기준 7:00, 촬영 13:00 → Score = 0.0 (부적합, 분석에서 가중치 하향)
```

---

## 2. 동일 조명 환경 보정 알고리즘 (Lighting Normalization)

### 2.1 조명 변수의 영향

| 조명 변수 | 피부 분석 영향 |
|----------|--------------|
| **밝기(Brightness)** | 밝은 조명 → 모공/주름 축소 인식, 어두운 조명 → 과장 |
| **색온도(Color Temperature)** | 따뜻한 조명(3000K) → 피부 붉음 과장, 차가운 조명(6500K) → 창백하게 |
| **방향성(Direction)** | 측면광 → 요철 강조, 정면광 → 매끈하게 |
| **균일성(Uniformity)** | 부분 그림자 → 색소 침착으로 오인 가능 |

### 2.2 조명 보정 파이프라인

#### Stage 1: 촬영 시점 가이드
```
1. 카메라 프리뷰에서 실시간 밝기/균일성 측정
2. 조명 품질 인디케이터 표시 (녹색/노란색/빨간색)
3. "좀 더 밝은 곳으로 이동하세요" 등 음성/텍스트 가이드
4. 최소 밝기/균일성 기준 미달 시 촬영 차단 (선택적)
```

#### Stage 2: 후처리 보정 알고리즘

```python
# 조명 보정 알고리즘 개요 (Pseudo-code)

def normalize_lighting(image, face_landmarks):
    # 1. 이마 중앙 영역에서 참조 밝기/색온도 추출
    ref_region = extract_forehead_region(face_landmarks)
    current_brightness = measure_brightness(ref_region)  # 0-255
    current_color_temp = measure_color_temperature(ref_region)  # Kelvin

    # 2. 표준 조건으로 보정 (목표: 5500K, 밝기 160)
    brightness_ratio = TARGET_BRIGHTNESS / current_brightness
    color_correction = compute_color_matrix(current_color_temp, TARGET_COLOR_TEMP)

    # 3. 히스토그램 균일화 (Adaptive)
    normalized = apply_CLAHE(image, clip_limit=2.0)

    # 4. 색온도 보정
    normalized = apply_color_correction(normalized, color_correction)

    # 5. 밝기 보정 (감마 보정)
    normalized = apply_gamma_correction(normalized, brightness_ratio)

    return normalized
```

#### Stage 3: 개인 기준선 (Personal Baseline) 보정
- 유저의 첫 7일간 촬영 데이터로 **개인 조명 프로필** 생성
- 이후 촬영 시 개인 프로필과의 편차를 추가 보정
- 환경이 크게 바뀌면(이사, 여행) 재캘리브레이션 안내

### 2.3 핵심 기술 스택

| 기술 | 용도 | 라이브러리/모델 |
|------|------|---------------|
| White Balance 자동 보정 | 색온도 표준화 | OpenCV (illuminant estimation) |
| CLAHE (Contrast Limited AHE) | 밝기 균일화 | OpenCV |
| Face Region Segmentation | 피부 영역만 분리 | BiSeNet, FARL |
| Color Constancy Algorithm | 조명 색상 불변 처리 | Grey World, Shades of Grey |

---

## 3. 얼굴 정렬 알고리즘 (Face Alignment)

### 3.1 정렬이 필요한 이유
- 매일 촬영 각도가 조금씩 다르면 동일 부위 비교 불가
- 5도의 회전 차이만으로도 코 옆 모공 측정치가 20% 이상 변동 가능
- 좌/우 비대칭 얼굴에서 각도에 따라 전혀 다른 분석 결과 도출

### 3.2 정렬 파이프라인

```
[Face Detection] → [Landmark Detection] → [3D Pose Estimation] → [Affine Transform] → [ROI Extraction]
```

#### Step 1: Face Detection
- **모델**: MediaPipe Face Detection 또는 RetinaFace
- 정면 얼굴 검출 + Bounding Box 추출
- 다수 얼굴 검출 시 가장 큰 얼굴(메인 유저) 선택

#### Step 2: Landmark Detection (68/478 포인트)
- **모델**: MediaPipe Face Mesh (478 landmarks) 또는 Dlib (68 landmarks)
- 핵심 랜드마크: 양 눈 중심, 코끝, 입 양 끝, 턱 끝
- 3D 좌표 추출 (depth 포함)

#### Step 3: 3D Pose Estimation
```
3축 회전 추정:
- Yaw (좌우 회전): 허용 범위 ±10°, 이상적 ±5°
- Pitch (상하 회전): 허용 범위 ±10°, 이상적 ±5°
- Roll (좌우 기울기): 허용 범위 ±5°, 이상적 ±2°
```
- 허용 범위 초과 시 재촬영 유도 ("고개를 살짝 왼쪽으로 돌려주세요")

#### Step 4: Affine Transform (2D 정규화)
```python
def align_face(image, landmarks):
    # 양 눈 중심 기반 정렬
    left_eye_center = landmarks.left_eye_center()
    right_eye_center = landmarks.right_eye_center()

    # 회전 각도 계산
    angle = compute_angle(left_eye_center, right_eye_center)

    # 눈 간 거리 기반 스케일 정규화
    eye_distance = compute_distance(left_eye_center, right_eye_center)
    scale = TARGET_EYE_DISTANCE / eye_distance

    # Affine 변환 적용
    M = cv2.getRotationMatrix2D(center, angle, scale)
    aligned = cv2.warpAffine(image, M, TARGET_SIZE)

    return aligned
```

#### Step 5: ROI (Region of Interest) 추출
| ROI | 분석 항목 | 랜드마크 기반 위치 |
|-----|----------|-----------------|
| 이마 | 주름, 피부결 | 눈썹 위 ~ 헤어라인 |
| 볼 (좌/우) | 모공, 색소, 홍조 | 광대뼈 ~ 턱선 |
| 코 주변 | 블랙헤드, 모공 | 눈 사이 ~ 코끝 |
| 턱/입 주변 | 트러블, 피부결 | 입 아래 ~ 턱 끝 |
| 눈 주변 | 주름, 다크서클 | 눈 아래 ~ 광대 위 |

---

## 4. 카메라 거리 보정 (Distance Normalization)

### 4.1 거리에 따른 영향
- 가까운 거리: 모공, 잔주름 등 세부 디테일 과장
- 먼 거리: 세부 디테일 손실, 피부가 매끈해 보임
- 거리 변화에 따른 원근 왜곡(Perspective Distortion): 코가 크게/작게 보임

### 4.2 거리 추정 방법

| 방법 | 원리 | 정확도 | 비용 |
|------|------|--------|------|
| **양 눈 간 거리 기반** | 양 눈 간 픽셀 거리로 카메라-얼굴 거리 추정 | ±3cm | 추가 센서 불요 |
| **얼굴 바운딩 박스 크기** | 얼굴 BB 크기와 거리의 반비례 관계 활용 | ±5cm | 추가 센서 불요 |
| **ToF/LiDAR 센서** | iPhone Pro 등의 깊이 센서 활용 | ±1cm | 특정 기기 한정 |
| **AR Framework** | ARKit/ARCore의 얼굴 깊이 추정 | ±2cm | 최신 기기 필요 |

### 4.3 거리 보정 전략

```
1. 촬영 가이드:
   - 화면에 얼굴 가이드 오버레이 표시 (타원형 프레임)
   - "얼굴을 프레임에 맞춰주세요" → 자연스럽게 일정 거리 유도
   - 양 눈 간 픽셀 거리 실시간 표시: 목표 범위 내 진입 시 녹색

2. 자동 촬영:
   - 얼굴이 가이드 프레임에 맞으면 자동 캡처 (3초 카운트다운)
   - 수동 촬영 시에도 거리 기준 미달이면 경고

3. 후처리:
   - 표준 거리(30cm)를 기준으로 해상도 보정
   - 너무 가까우면 다운샘플링, 너무 멀면 초해상화(Super Resolution) 적용
   - 원근 왜곡 보정 (Perspective Correction)
```

### 4.4 권장 촬영 거리

| 항목 | 값 |
|------|---|
| 목표 거리 | 30cm (±5cm) |
| 허용 범위 | 25cm ~ 40cm |
| 최소 거리 (경고) | 20cm 미만 |
| 최대 거리 (경고) | 50cm 초과 |
| 양 눈 간 목표 픽셀 | 120-160px (1080p 기준) |

---

## 5. 이미지 품질 검증 (Image Quality Assessment)

### 5.1 검증 항목

#### (1) Blur Detection (흐림 감지)
```python
def detect_blur(image):
    # Laplacian 분산 기반 블러 감지
    laplacian_var = cv2.Laplacian(gray_image, cv2.CV_64F).var()

    # 임계값 기준
    if laplacian_var < 50:
        return "REJECT"   # 심한 블러, 재촬영 필요
    elif laplacian_var < 100:
        return "WARNING"  # 약간의 블러, 분석 정확도 감소 가능
    else:
        return "PASS"     # 선명한 이미지
```

#### (2) Exposure Check (노출 검증)
```python
def check_exposure(image):
    brightness = np.mean(image)

    if brightness < 60:
        return "UNDEREXPOSED"   # 너무 어두움
    elif brightness > 200:
        return "OVEREXPOSED"    # 너무 밝음 (하이라이트 날림)
    elif brightness < 80 or brightness > 180:
        return "WARNING"        # 보정 필요하지만 사용 가능
    else:
        return "OPTIMAL"        # 적정 노출
```

#### (3) White Balance Verification (화이트 밸런스 검증)
- 피부 톤이 극단적으로 파랗거나 노란 경우 감지
- 피부 영역의 평균 색상이 정상 피부 톤 범위 내인지 확인
- Skin Color Gamut 기반 이상치 검출

#### (4) Motion Blur Detection (움직임 블러)
- 방향성 블러 패턴 감지 (Fourier Transform 분석)
- 랜드마크 검출 신뢰도가 낮으면 움직임 블러 의심

#### (5) Occlusion Detection (가림 검출)
- 얼굴 주요 영역(눈, 코, 볼, 이마)의 가림 여부 확인
- 마스크, 안경, 머리카락, 손 등에 의한 가림 감지
- 가림 비율 20% 초과 시 경고, 40% 초과 시 거부

### 5.2 종합 이미지 품질 점수 (Image Quality Score, IQS)

```python
def compute_image_quality_score(image, landmarks):
    scores = {
        'sharpness': compute_sharpness_score(image),        # 0-1
        'exposure': compute_exposure_score(image),            # 0-1
        'white_balance': compute_wb_score(image),             # 0-1
        'face_alignment': compute_alignment_score(landmarks), # 0-1
        'distance': compute_distance_score(landmarks),        # 0-1
        'occlusion': compute_occlusion_score(image, landmarks) # 0-1
    }

    weights = {
        'sharpness': 0.25,
        'exposure': 0.20,
        'white_balance': 0.15,
        'face_alignment': 0.20,
        'distance': 0.10,
        'occlusion': 0.10
    }

    iqs = sum(scores[k] * weights[k] for k in scores)
    return iqs  # 0-1, 0.7 이상 권장

# IQS 등급
# >= 0.85: Excellent (최고 신뢰도)
# >= 0.70: Good (분석 가능)
# >= 0.50: Fair (분석 가능하나 정확도 저하 가능)
# < 0.50:  Poor (재촬영 권장)
```

---

## 6. 이상치 감지 및 제거 (Outlier Detection)

### 6.1 이상치 유형

| 유형 | 원인 | 예시 |
|------|------|------|
| **촬영 조건 이상** | 극단적 조명, 화장 상태 촬영, 다른 사람 촬영 | 갑자기 피부 점수 +50% |
| **일시적 외부 요인** | 심한 일광 화상, 알레르기 반응, 시술 직후 | 갑자기 트러블 점수 극단적 상승 |
| **시스템 오류** | AI 모델 오분류, 이미지 처리 오류 | 비현실적 수치 |
| **장기 환경 변화** | 이사(조명 환경 변화), 카메라 교체 | 기준선(Baseline) 갑작스러운 변동 |

### 6.2 이상치 감지 알고리즘

#### Method 1: Z-Score 기반 (개인 내 비교)
```python
def detect_outlier_zscore(measurements, new_value, window=30):
    """최근 30일 데이터 기준 Z-Score 계산"""
    recent = measurements[-window:]
    mean = np.mean(recent)
    std = np.std(recent)

    if std == 0:
        return False

    z_score = abs(new_value - mean) / std
    return z_score > 2.5  # |Z| > 2.5이면 이상치 의심
```

#### Method 2: IQR (Interquartile Range) 기반
```python
def detect_outlier_iqr(measurements, new_value, window=30):
    """IQR 기반 이상치 감지"""
    recent = measurements[-window:]
    Q1 = np.percentile(recent, 25)
    Q3 = np.percentile(recent, 75)
    IQR = Q3 - Q1

    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR

    return new_value < lower_bound or new_value > upper_bound
```

#### Method 3: 변화율 기반 (Day-over-Day Change)
```python
def detect_sudden_change(prev_value, new_value, threshold=0.3):
    """전일 대비 30% 이상 변화 시 이상치 의심"""
    if prev_value == 0:
        return False
    change_rate = abs(new_value - prev_value) / prev_value
    return change_rate > threshold
```

### 6.3 이상치 처리 전략

| 단계 | 처리 방식 | 사용자 경험 |
|------|----------|------------|
| **1. 감지** | 3개 방법 중 2개 이상에서 이상치로 판별 시 플래그 | - |
| **2. 사용자 확인** | "오늘 측정값이 평소와 크게 다릅니다. 특별한 이유가 있나요?" | 팝업 알림 |
| **3-a. 설명 가능** | 사용자가 이유 입력 (예: "일광 화상", "시술 후") → 이벤트 태그 | 데이터 유지, 별도 표시 |
| **3-b. 설명 불가** | 이미지 품질 점수(IQS) 확인 → IQS < 0.5면 제거 권유 | 재촬영 유도 |
| **4. 분석 가중치** | 이상치 데이터는 추세 분석 시 가중치 하향 (0.3x) | 그래프에 반투명 표시 |

---

## 7. 측정 조건 메타데이터 기록 (Measurement Metadata)

### 7.1 자동 수집 메타데이터

| 카테고리 | 항목 | 수집 방법 |
|---------|------|----------|
| **시간** | 촬영 시간 (UTC + 로컬), 요일 | 시스템 시계 |
| **장치** | 기기 모델, OS 버전, 카메라 스펙 | 시스템 API |
| **카메라** | 전/후면, 해상도, 초점거리, ISO, 셔터스피드 | EXIF 데이터 |
| **환경** | GPS 기반 위치(시/구 수준), 날씨, 온도, 습도 | Weather API |
| **이미지** | IQS 점수, 밝기, 색온도, 블러 수치 | 자체 분석 |
| **얼굴** | 얼굴 크기(px), 눈 간 거리(px), Yaw/Pitch/Roll | 랜드마크 분석 |

### 7.2 사용자 입력 메타데이터 (선택적)

| 카테고리 | 항목 | 입력 방식 |
|---------|------|----------|
| **피부 상태** | 주관적 피부 컨디션 (1-5점) | 이모지 슬라이더 |
| **수면** | 수면 시간 | 간단 입력 또는 Health Kit 연동 |
| **생리 주기** | 생리 주기 단계 | 캘린더 연동 또는 수동 입력 |
| **특이 사항** | 음주, 야근, 스트레스, 운동 등 | 태그 선택 (다중 선택) |
| **스킨케어** | 오늘 사용한 제품, 새 제품 시작/중단 | 루틴 기록에서 자동 연동 |

### 7.3 메타데이터 활용

1. **분석 보정**: 조명/거리 메타데이터로 피부 분석 결과 보정
2. **상관관계 분석**: 수면, 날씨, 생리 주기 vs 피부 상태 상관관계 발견
3. **이상치 설명**: 갑작스러운 변화에 대한 원인 추정 지원
4. **데이터 품질 관리**: 촬영 조건이 일관된 데이터에 높은 가중치 부여

---

## 8. 최소 신뢰도 기준 설정 (Minimum Confidence Threshold)

### 8.1 분석 레벨별 최소 요건

| 분석 레벨 | 필요 데이터 | 최소 IQS | 최소 시간 일관성 | 용도 |
|----------|-----------|---------|----------------|------|
| **Level 1: 일일 스냅샷** | 단일 이미지 | 0.50 | - | 당일 피부 상태 요약 |
| **Level 2: 주간 트렌드** | 5일+ / 7일 | 0.65 (평균) | 0.60 | 주간 피부 변화 추이 |
| **Level 3: 제품 효과 분석** | 21일+ 연속 | 0.70 (평균) | 0.70 | 화장품 효과 판정 |
| **Level 4: 인과관계 추론** | 42일+ (전 2주 + 후 4주) | 0.75 (평균) | 0.75 | 제품-피부 인과관계 분석 |
| **Level 5: 커뮤니티 기여** | Level 3+ 달성 | 0.75 | 0.75 | 제품 효과 DB 기여 데이터 |

### 8.2 신뢰도 등급 시스템

```
종합 신뢰도 점수(Confidence Score) =
    IQS_avg × 0.30 +           # 이미지 품질 평균
    Time_consistency × 0.25 +   # 시간 일관성
    Data_completeness × 0.25 +  # 데이터 완결성 (빠진 날 비율)
    Outlier_ratio × 0.20        # 이상치 비율 (적을수록 높음)
```

| 신뢰도 등급 | 점수 범위 | 표시 | 분석 활용 |
|------------|----------|------|----------|
| **Diamond** | 0.90+ | 다이아몬드 배지 | 모든 분석 + 커뮤니티 기여 |
| **Gold** | 0.75-0.89 | 골드 배지 | Level 1-4 분석 가능 |
| **Silver** | 0.60-0.74 | 실버 배지 | Level 1-3 분석 가능 |
| **Bronze** | 0.40-0.59 | 브론즈 배지 | Level 1-2 분석 가능 |
| **Unrated** | 0.40 미만 | 회색 | Level 1만 가능, 개선 가이드 제공 |

### 8.3 사용자 신뢰도 향상 가이드

유저의 현재 등급에 따라 개인화된 개선 가이드 제공:

```
[Bronze 유저에게]
"신뢰도를 Silver로 올리면 주간 트렌드 분석이 가능해요!
개선 포인트:
✓ 매일 같은 시간에 촬영하세요 (현재 시간 편차: 평균 47분)
✓ 밝은 곳에서 촬영하세요 (최근 3일 이미지가 어두웠어요)
✓ 얼굴을 프레임에 맞춰 촬영하세요"
```

### 8.4 효과 판정 통계 기준

| 판정 | 조건 | 표시 |
|------|------|------|
| **효과 있음 (Effective)** | p-value < 0.05, 개선 방향, Effect Size > 0.3 | 녹색 + "효과가 확인되었습니다" |
| **약간 효과 (Mild Effect)** | p-value < 0.10, 개선 방향, Effect Size 0.1-0.3 | 연두색 + "약간의 효과가 관찰됩니다" |
| **판단 불가 (Inconclusive)** | p-value >= 0.10 또는 데이터 부족 | 회색 + "아직 판단하기 어렵습니다. N일 더 사용해보세요" |
| **효과 없음 (No Effect)** | p-value < 0.05, 변화 없음, Effect Size < 0.1 | 노란색 + "유의미한 변화가 관찰되지 않았습니다" |
| **악화 (Worsened)** | p-value < 0.05, 악화 방향, Effect Size > 0.3 | 빨간색 + "피부 상태가 악화되었습니다. 사용 중단을 고려하세요" |

---

## 9. 전체 파이프라인 요약

```
[사용자 촬영]
     │
     ▼
[1. 시간 검증] ─── 시간대 이탈 경고 ───→ [메타데이터 기록]
     │
     ▼
[2. 실시간 가이드] ─── 조명/거리/각도 가이드 표시
     │
     ▼
[3. 자동 캡처] ─── 가이드 조건 충족 시 자동 촬영
     │
     ▼
[4. 이미지 품질 검증] ─── IQS < 0.50 → 재촬영 유도
     │
     ▼
[5. 얼굴 정렬 + 거리 보정 + 조명 보정]
     │
     ▼
[6. AI 피부 분석] ─── 7가지 지표 수치화
     │
     ▼
[7. 이상치 감지] ─── 이상치 발견 시 사용자 확인
     │
     ▼
[8. 신뢰도 점수 계산] ─── 등급 업데이트
     │
     ▼
[9. 데이터 저장] ─── 분석 결과 + 메타데이터 + 신뢰도 점수
```
