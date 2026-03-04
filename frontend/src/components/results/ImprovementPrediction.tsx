import { ArrowRight, TrendingUp } from "lucide-react";
import SkinScoreCircle from "./SkinScoreCircle";

interface Props {
  currentScore: number;
}

function predictImprovement(score: number): number {
  // Lower scores have more improvement potential
  if (score >= 90) return Math.min(score + 2, 100);
  if (score >= 80) return Math.min(score + 5, 100);
  if (score >= 60) return Math.min(score + 10, 100);
  if (score >= 40) return Math.min(score + 15, 98);
  return Math.min(score + 20, 95);
}

export default function ImprovementPrediction({ currentScore }: Props) {
  const projected = predictImprovement(currentScore);
  const delta = projected - currentScore;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-[#5B8CFF]" />
        <h3 className="text-sm font-bold text-[#191F28]">4주 개선 예측</h3>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center">
          <SkinScoreCircle score={currentScore} size="sm" />
          <p className="mt-1 text-[10px] text-[#8B95A1]">현재</p>
        </div>

        <ArrowRight size={20} className="text-[#D1D6DB]" />

        <div className="flex flex-col items-center">
          <SkinScoreCircle score={projected} variant="projected" size="sm" />
          <p className="mt-1 text-[10px] text-[#8B95A1]">4주 후</p>
        </div>
      </div>

      <p className="mt-4 text-center text-sm font-semibold text-[#30D158]">
        +{delta}점 개선 가능
      </p>
      <p className="mt-1 text-center text-[10px] text-[#8B95A1]">
        맞춤 스킨케어 루틴을 꾸준히 따르면 도달 가능한 예측 점수입니다
      </p>
    </div>
  );
}
