import { getStatusFillColor, type StatusLevel } from "./StatusBadge";

interface Props {
  percent: number;
  status: StatusLevel;
}

export default function GaugeBar({ percent, status }: Props) {
  const fillColor = getStatusFillColor(status);
  const clampedPercent = Math.max(0, Math.min(100, percent));

  return (
    <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
        style={{
          width: `${clampedPercent}%`,
          backgroundColor: fillColor,
        }}
      />
      <div
        className="absolute top-1/2 h-3 w-1 rounded-full"
        style={{
          left: `${clampedPercent}%`,
          backgroundColor: fillColor,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
