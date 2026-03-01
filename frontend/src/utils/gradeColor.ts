import { GRADE_COLORS } from "../constants/skinMetrics";

export function gradeColor(grade: number): string {
  return GRADE_COLORS[Math.min(grade, GRADE_COLORS.length - 1)];
}

/** 회귀 수치를 0-1 비율로 변환 후 색상 반환 */
export function valueColor(ratio: number, higherIsBetter: boolean): string {
  // ratio: 0..1 within the metric range
  const effective = higherIsBetter ? 1 - ratio : ratio;
  if (effective < 0.25) return "#22c55e";
  if (effective < 0.5) return "#eab308";
  if (effective < 0.75) return "#f97316";
  return "#ef4444";
}
