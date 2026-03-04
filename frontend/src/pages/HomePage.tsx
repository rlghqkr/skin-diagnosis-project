import { useNavigate } from "react-router-dom";
import { Sparkles, Droplets, Search, FlaskConical, ChevronRight } from "lucide-react";
import SkinScoreCircle from "../components/results/SkinScoreCircle";
import { useAnalysisHistory } from "../hooks/useAnalysisHistory";
import { formatRelativeDate } from "../utils/formatDate";

interface Props {
  onOpenPhotoSheet?: () => void;
}

export default function HomePage({ onOpenPhotoSheet }: Props) {
  const navigate = useNavigate();
  const { latestRecord, scoreDelta } = useAnalysisHistory();

  return (
    <div className="flex min-h-[calc(100dvh-120px)] flex-col bg-[#F7F9FC]">
      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-md text-center">
          {/* Gradient icon */}
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, #EBF1FF, #E0F5EE)" }}
          >
            <Sparkles size={28} className="text-[#5B8CFF]" />
          </div>

          <h2 className="mb-3 text-2xl font-bold tracking-tight text-[#191F28] sm:text-3xl">
            AI 피부 분석
          </h2>
          <p className="mx-auto mb-2 max-w-xs text-sm leading-relaxed text-[#8B95A1]">
            사진 한 장으로 피부 상태를 정밀하게 분석하고
            <br />
            맞춤 화장품을 추천받으세요
          </p>
          <p className="mx-auto mb-10 text-xs text-[#B0B8C1]">
            5개 항목 · 9개 부위 · 무료
          </p>

          {/* Single CTA */}
          <button
            type="button"
            onClick={onOpenPhotoSheet}
            className="mx-auto flex items-center justify-center gap-3 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-[0_4px_16px_rgba(91,140,255,0.3)] active:brightness-95 transition-all"
            style={{ background: "linear-gradient(135deg, #5B8CFF, #4A75E0)" }}
          >
            피부 분석 시작하기
          </button>
        </div>
      </div>

      {/* Daily Skin Score (if history exists) */}
      {latestRecord && (
        <div className="px-5 pb-6">
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#191F28]">피부 점수</h3>
              <span className="text-xs text-[#8B95A1]">
                마지막 분석: {formatRelativeDate(latestRecord.timestamp)}
              </span>
            </div>
            <div className="flex items-center gap-5">
              <SkinScoreCircle score={latestRecord.score} size="sm" />
              <div className="flex-1">
                {scoreDelta !== null && (
                  <p className={`text-sm font-semibold ${scoreDelta >= 0 ? "text-[#30D158]" : "text-[#F04452]"}`}>
                    {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta}점 {scoreDelta >= 0 ? "개선" : "변화"}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/results/dashboard", { state: { analyzeResult: latestRecord.fullResult } })}
                  className="mt-2 text-xs font-medium text-[#5B8CFF]"
                >
                  결과 보기 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Preview Cards */}
      <div className="px-5 pb-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Droplets, label: "피부 상태 분석", desc: "5가지 지표" },
            { icon: Search, label: "부위별 정밀 분석", desc: "9개 얼굴 영역" },
            { icon: FlaskConical, label: "맞춤 성분 추천", desc: "AI 성분 매칭" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF1FF]">
                <item.icon size={18} className="text-[#5B8CFF]" />
              </div>
              <span className="text-xs font-semibold text-[#191F28]">{item.label}</span>
              <span className="text-[10px] text-[#8B95A1]">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="px-5 pb-8">
        <h3 className="mb-4 text-sm font-bold text-[#191F28]">이용 방법</h3>
        <div className="space-y-3">
          {[
            { step: "1", title: "사진 촬영", desc: "정면 얼굴 사진을 촬영하거나 업로드하세요" },
            { step: "2", title: "AI 분석", desc: "딥러닝 모델이 피부 상태를 정밀 분석합니다" },
            { step: "3", title: "결과 확인", desc: "분석 결과와 맞춤 화장품 추천을 확인하세요" },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#5B8CFF] text-sm font-bold text-white">
                {item.step}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#191F28]">{item.title}</p>
                <p className="text-xs text-[#8B95A1]">{item.desc}</p>
              </div>
              <ChevronRight size={14} className="text-[#D1D6DB]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
