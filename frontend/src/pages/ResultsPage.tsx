import { useNavigate } from "react-router-dom";
import { BarChart3, RotateCcw } from "lucide-react";

export default function ResultsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-8">
      <div className="animate-float-in flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F3FF]">
          <BarChart3 size={28} className="text-[#3182F6]" />
        </div>

        <h2 className="mb-2 text-xl font-bold text-[#191F28]">
          분석 결과
        </h2>
        <p className="mb-8 max-w-xs text-sm text-[#8B95A1]">
          사진을 촬영하거나 업로드하여 피부 분석을 시작하세요.
          분석 완료 후 상세 결과가 여기에 표시됩니다.
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 rounded-2xl bg-[#3182F6] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(49,130,246,0.3)]"
        >
          <RotateCcw size={16} />
          분석 시작하기
        </button>
      </div>
    </div>
  );
}
