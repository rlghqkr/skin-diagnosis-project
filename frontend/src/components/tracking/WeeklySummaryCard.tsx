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
  if (improving >= 4) {
    status = "좋은 추세";
    statusColor = "#34C759";
  } else if (declining >= 4) {
    status = "관리 필요";
    statusColor = "#EF4444";
  } else {
    status = "안정적";
    statusColor = "#3B82F6";
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-[#8B95A1]">주간 요약</p>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-[#191F28]">{avg}</span>
            <span className="mb-0.5 text-xs text-[#8B95A1]">평균 점수</span>
          </div>
          {prevAvg !== null && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              {diff > 0 ? (
                <TrendingUp size={12} className="text-[#34C759]" />
              ) : diff < 0 ? (
                <TrendingDown size={12} className="text-[#EF4444]" />
              ) : (
                <Minus size={12} className="text-[#8B95A1]" />
              )}
              <span
                style={{
                  color:
                    diff > 0 ? "#34C759" : diff < 0 ? "#EF4444" : "#8B95A1",
                }}
              >
                지난주 대비 {diff > 0 ? "+" : ""}
                {diff}
              </span>
            </div>
          )}
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: statusColor }}
        >
          {status}
        </div>
      </div>
    </div>
  );
}
