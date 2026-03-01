/** 얼굴 부위 한국어 라벨 */
export const FACEPART_LABELS: Record<string, string> = {
  full_face: "전체 얼굴",
  forehead: "이마",
  glabellus: "미간",
  left_perocular: "왼쪽 눈가",
  right_perocular: "오른쪽 눈가",
  left_cheek: "왼쪽 볼",
  right_cheek: "오른쪽 볼",
  lip: "입술",
  chin: "턱",
};

/** 분류 지표 정의 */
export const CLASS_METRICS: Record<
  string,
  { label: string; grades: number }
> = {
  dryness: { label: "건조도", grades: 5 },
  pigmentation: { label: "색소침착", grades: 6 },
  pore: { label: "모공", grades: 6 },
  sagging: { label: "처짐", grades: 6 },
  wrinkle: { label: "주름", grades: 7 },
};

/** 회귀 지표 정의 (범위 + 단위) */
export const REGRESSION_METRICS: Record<
  string,
  { label: string; min: number; max: number; unit: string; higherIsBetter: boolean }
> = {
  pigmentation: { label: "색소침착", min: 0, max: 350, unit: "ITA°", higherIsBetter: false },
  moisture: { label: "수분", min: 0, max: 100, unit: "%", higherIsBetter: true },
  elasticity_R2: { label: "탄력", min: 0, max: 1, unit: "R2", higherIsBetter: true },
  wrinkle_Ra: { label: "주름", min: 0, max: 50, unit: "Ra", higherIsBetter: false },
  pore: { label: "모공", min: 0, max: 2600, unit: "", higherIsBetter: false },
};

/** 얼굴 부위별 오버레이 위치 (% 좌표) 및 라벨 배치 */
export interface FaceRegionPosition {
  top: number;
  left: number;
  width: number;
  height: number;
  labelSide: "left" | "right" | "top" | "bottom";
}

export const FACE_REGION_POSITIONS: Record<string, FaceRegionPosition> = {
  forehead:        { top: 8,  left: 30, width: 40, height: 14, labelSide: "right" },
  glabellus:       { top: 24, left: 38, width: 24, height: 6,  labelSide: "left" },
  left_perocular:  { top: 26, left: 18, width: 20, height: 8,  labelSide: "left" },
  right_perocular: { top: 26, left: 62, width: 20, height: 8,  labelSide: "right" },
  left_cheek:      { top: 42, left: 12, width: 28, height: 16, labelSide: "left" },
  right_cheek:     { top: 42, left: 60, width: 28, height: 16, labelSide: "right" },
  lip:             { top: 64, left: 32, width: 36, height: 10, labelSide: "right" },
  chin:            { top: 76, left: 32, width: 36, height: 12, labelSide: "left" },
};

/** 등급별 색상 (0=양호 → 높은 등급=심각) */
export const GRADE_COLORS = [
  "#22c55e", // 0 - green
  "#84cc16", // 1 - lime
  "#eab308", // 2 - yellow
  "#f97316", // 3 - orange
  "#ef4444", // 4 - red
  "#dc2626", // 5 - deeper red
  "#991b1b", // 6 - darkest red
];

/** 등급별 한국어 상태 설명 */
export const GRADE_DESCRIPTIONS = [
  "양호",     // 0
  "경미",     // 1
  "보통",     // 2
  "주의",     // 3
  "나쁨",     // 4
  "심각",     // 5
  "매우 심각", // 6
];

/** 등급 → 상태 설명 텍스트 */
export function getGradeDescription(grade: number): string {
  return GRADE_DESCRIPTIONS[Math.min(grade, GRADE_DESCRIPTIONS.length - 1)];
}

/** 회귀 수치 비율 → 상태 텍스트 + 색상 */
export function getValueStatus(ratio: number, higherIsBetter: boolean): { label: string; color: string } {
  const effective = higherIsBetter ? 1 - ratio : ratio;
  if (effective < 0.25) return { label: "양호", color: "#22c55e" };
  if (effective < 0.5) return { label: "보통", color: "#eab308" };
  if (effective < 0.75) return { label: "주의", color: "#f97316" };
  return { label: "나쁨", color: "#ef4444" };
}
