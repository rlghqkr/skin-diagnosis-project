import { gradeColor } from "../../utils/gradeColor";

interface Props {
  probabilities: number[];
}

export default function GradeBar({ probabilities }: Props) {
  return (
    <div className="flex h-4 w-full overflow-hidden rounded-full bg-white/[0.04]">
      {probabilities.map((prob, i) => (
        <div
          key={i}
          className="relative h-full transition-all duration-500 ease-out"
          style={{
            width: `${prob * 100}%`,
            backgroundColor: gradeColor(i),
            minWidth: prob > 0 ? "2px" : 0,
            opacity: 0.8,
          }}
          title={`${i}등급: ${(prob * 100).toFixed(1)}%`}
        >
          {/* Inner shimmer */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"
          />
        </div>
      ))}
    </div>
  );
}
