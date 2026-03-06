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
  const DiffIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const diffColor = diff > 0 ? "#34C759" : diff < 0 ? "#EF4444" : "#8B95A1";

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <p className="text-[11px] font-semibold tracking-wide text-[#8B95A1]">오늘</p>
      <div className="mt-2">
        <span className="text-[32px] font-bold tabular-nums leading-none" style={{ color }}>
          {today.overall_score}
        </span>
        <span className="ml-1 text-[12px] text-[#B0B8C1]">점</span>
      </div>
      {yesterday && (
        <div className="mt-2 flex items-center gap-1">
          <DiffIcon size={12} style={{ color: diffColor }} />
          <span className="text-[12px] font-semibold" style={{ color: diffColor }}>
            {diff > 0 ? "+" : ""}{diff}
          </span>
          <span className="text-[11px] text-[#B0B8C1]">어제 대비</span>
        </div>
      )}
    </div>
  );
}
