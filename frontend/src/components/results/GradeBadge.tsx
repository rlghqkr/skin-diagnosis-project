import { gradeColor } from "../../utils/gradeColor";
import { getGradeDescription } from "../../constants/skinMetrics";

interface Props {
  grade: number;
}

export default function GradeBadge({ grade }: Props) {
  const color = gradeColor(grade);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      <div
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {grade}등급 · {getGradeDescription(grade)}
    </span>
  );
}
