import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DailyScore } from "../../stores/useTrackingStore";

interface Props {
  today: DailyScore;
  yesterday: DailyScore | null;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#34C759";
  if (score >= 60) return "#3B82F6";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

export default function DailyScoreCard({ today, yesterday }: Props) {
  const diff = yesterday ? today.overall_score - yesterday.overall_score : 0;
  const color = getScoreColor(today.overall_score);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-[#8B95A1]">오늘의 피부 점수</p>
      <div className="mt-2 flex items-end gap-3">
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>
          {today.overall_score}
        </span>
        <span className="mb-1 text-sm text-[#8B95A1]">/ 100</span>
        {yesterday && (
          <div className="mb-1 ml-auto flex items-center gap-1">
            {diff > 0 ? (
              <TrendingUp size={14} className="text-[#34C759]" />
            ) : diff < 0 ? (
              <TrendingDown size={14} className="text-[#EF4444]" />
            ) : (
              <Minus size={14} className="text-[#8B95A1]" />
            )}
            <span
              className="text-sm font-semibold"
              style={{
                color: diff > 0 ? "#34C759" : diff < 0 ? "#EF4444" : "#8B95A1",
              }}
            >
              {diff > 0 ? "+" : ""}
              {diff}
            </span>
            <span className="text-xs text-[#8B95A1]">어제 대비</span>
          </div>
        )}
      </div>
    </div>
  );
}
