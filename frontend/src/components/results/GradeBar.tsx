import { gradeColor } from "../../utils/gradeColor";

interface Props {
  probabilities: number[];
}

export default function GradeBar({ probabilities }: Props) {
  return (
    <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#F2F4F6]">
      {probabilities.map((prob, i) => (
        <div
          key={i}
          className="relative h-full transition-all duration-500 ease-out"
          style={{
            width: `${prob * 100}%`,
            backgroundColor: gradeColor(i),
            minWidth: prob > 0 ? "2px" : 0,
            opacity: 0.85,
          }}
          title={`${i}등급: ${(prob * 100).toFixed(1)}%`}
        />
      ))}
    </div>
  );
}
