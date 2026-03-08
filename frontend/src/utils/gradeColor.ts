import { GRADE_COLORS } from "../constants/skinMetrics";

export function gradeColor(grade: number): string {
  return GRADE_COLORS[Math.min(grade, GRADE_COLORS.length - 1)];
}

/** 회귀 수치를 0-1 비율로 변환 후 색상 반환 */
export function valueColor(ratio: number, higherIsBetter: boolean): string {
  const effective = higherIsBetter ? 1 - ratio : ratio;
  if (effective < 0.25) return "#4CAF50";
  if (effective < 0.5) return "#FFA726";
  if (effective < 0.75) return "#EF5350";
  return "#C62828";
}
