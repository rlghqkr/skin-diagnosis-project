import { valueColor } from "../../utils/gradeColor";
import { formatValue } from "../../utils/formatValue";
import { getValueStatus } from "../../constants/skinMetrics";

interface Props {
  value: number;
  min: number;
  max: number;
  unit: string;
  higherIsBetter: boolean;
}

export default function ValueGauge({ value, min, max, unit, higherIsBetter }: Props) {
  const clamped = Math.max(min, Math.min(value, max));
  const ratio = max > min ? (clamped - min) / (max - min) : 0;
  const color = valueColor(ratio, higherIsBetter);
  const status = getValueStatus(ratio, higherIsBetter);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold" style={{ color }}>
            {formatValue(value)}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              color: status.color,
              backgroundColor: `${status.color}15`,
            }}
          >
            {status.label}
          </span>
        </div>
        <span className="text-[10px] text-[#8B95A1]">{unit}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F2F4F6]">
        <div
          className="relative h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${ratio * 100}%`, backgroundColor: color }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-[#8B95A1]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
