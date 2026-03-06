import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DailyScore } from "../../stores/useTrackingStore";

interface Props {
  data: DailyScore[];
}

export default function WeeklySummaryCard({ data }: Props) {
  const last7 = data.slice(-7);
  const prev7 = data.slice(-14, -7);

  if (last7.length === 0) return null;

  const avg = Math.round(
    last7.reduce((s, d) => s + d.overall_score, 0) / last7.length,
  );
  const prevAvg =
    prev7.length > 0
      ? Math.round(
          prev7.reduce((s, d) => s + d.overall_score, 0) / prev7.length,
        )
      : null;

  const diff = prevAvg !== null ? avg - prevAvg : 0;

  const improving = last7.filter((d) => d.trend_direction === "improving").length;
  const declining = last7.filter((d) => d.trend_direction === "declining").length;

  let status: string;
  let statusColor: string;
  let statusBg: string;
  if (improving >= 4) {
    status = "좋은 추세";
    statusColor = "#059669";
    statusBg = "#ECFDF5";
  } else if (declining >= 4) {
    status = "관리 필요";
    statusColor = "#DC2626";
    statusBg = "#FEF2F2";
  } else {
    status = "안정적";
    statusColor = "#3B82F6";
    statusBg = "#EFF6FF";
  }

  const DiffIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const diffColor = diff > 0 ? "#34C759" : diff < 0 ? "#EF4444" : "#8B95A1";

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <p className="text-[11px] font-semibold tracking-wide text-[#8B95A1]">주간 평균</p>
      <div className="mt-2">
        <span className="text-[32px] font-bold tabular-nums leading-none text-[#191F28]">
          {avg}
        </span>
        <span className="ml-1 text-[12px] text-[#B0B8C1]">점</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: statusBg, color: statusColor }}
        >
          {status}
        </span>
        {prevAvg !== null && (
          <div className="flex items-center gap-0.5">
            <DiffIcon size={11} style={{ color: diffColor }} />
            <span className="text-[11px] font-medium" style={{ color: diffColor }}>
              {diff > 0 ? "+" : ""}{diff}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
