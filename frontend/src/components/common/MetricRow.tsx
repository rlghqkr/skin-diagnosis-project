import GaugeBar from "./GaugeBar";
import StatusBadge, { type StatusLevel } from "./StatusBadge";

interface Props {
  label: string;
  sublabel?: string;
  percent: number;
  statusLabel: string;
  status: StatusLevel;
  value?: string;
  unit?: string;
}

export default function MetricRow({
  label,
  sublabel,
  percent,
  statusLabel,
  status,
  value,
  unit,
}: Props) {
  return (
    <div className="flex flex-col gap-2 py-3 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[14px] font-medium text-foreground">
            {label}
          </span>
          {sublabel && (
            <span className="text-[12px] text-muted-foreground">
              {sublabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {value && (
            <span className="text-[14px] font-semibold text-foreground tabular-nums">
              {value}
              {unit && (
                <span className="text-[11px] text-muted-foreground ml-0.5">
                  {unit}
                </span>
              )}
            </span>
          )}
          <StatusBadge label={statusLabel} status={status} />
        </div>
      </div>
      <GaugeBar percent={percent} status={status} />
    </div>
  );
}
