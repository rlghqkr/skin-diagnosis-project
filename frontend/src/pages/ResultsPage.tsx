import { useNavigate } from "react-router-dom";
import { BarChart3, RotateCcw } from "lucide-react";

export default function ResultsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-8">
      <div className="animate-float-in flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <BarChart3 size={28} className="text-rose-400" />
        </div>

        <h2 className="mb-2 text-xl font-semibold text-cream-200">
          분석 결과
        </h2>
        <p className="mb-8 max-w-xs text-sm text-white/40">
          사진을 촬영하거나 업로드하여 피부 분석을 시작하세요.
          분석 완료 후 상세 결과가 여기에 표시됩니다.
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="btn-primary flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-medium text-white shadow-lg shadow-rose-500/15"
        >
          <RotateCcw size={16} />
          분석 시작하기
        </button>
      </div>
    </div>
  );
}
