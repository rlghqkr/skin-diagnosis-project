import { useNavigate } from "react-router-dom";
import { Sparkles, Droplets, Search, FlaskConical, TrendingUp, ArrowRight } from "lucide-react";
import SkinScoreCircle from "../components/results/SkinScoreCircle";
import RecommendedSection from "../components/recommendation/RecommendedSection";
import { useAnalysisHistory } from "../hooks/useAnalysisHistory";
import { formatRelativeDate } from "../utils/formatDate";

interface Props {
  onOpenPhotoSheet?: () => void;
}

export default function HomePage({ onOpenPhotoSheet }: Props) {
  const navigate = useNavigate();
  const { latestRecord, scoreDelta } = useAnalysisHistory();

  return (
    <div className="flex min-h-[calc(100dvh-120px)] flex-col">
      {/* ── Hero Section ── */}
      <div className="bg-white px-5 pt-8 pb-10">
        <div className="mx-auto w-full max-w-md">
          {/* Headline — 1초 안에 핵심 가치 전달 */}
          <h2 className="text-[26px] font-bold leading-[1.35] tracking-tight text-[#191F28]">
            사진 한 장으로
            <br />
            <span className="gradient-text">피부를 읽다</span>
          </h2>
          <p className="mt-3 text-[15px] leading-[1.5] text-[#6B7684]">
            AI가 5개 지표 · 9개 부위를 정밀 분석하고
            <br />
            나에게 맞는 화장품을 추천합니다
          </p>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={onOpenPhotoSheet}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl h-[56px] text-[16px] font-semibold text-white shadow-[0_4px_20px_rgba(91,140,255,0.3)] active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #5B8CFF, #7ED7C1)" }}
          >
            <Sparkles size={20} />
            피부 분석 시작하기
          </button>

          {/* Trust signal */}
          <p className="mt-3 text-center text-[12px] text-[#B0B8C1]">
            무료 · 회원가입 없이 바로 분석
          </p>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 bg-[#F7F9FC] px-5 pt-6 pb-8">
        <div className="mx-auto w-full max-w-md space-y-5">
          {/* Daily Skin Score — 가장 중요한 정보를 최상단에 */}
          {latestRecord && (
            <button
              type="button"
              onClick={() => navigate("/results/dashboard", { state: { analyzeResult: latestRecord.fullResult, viewOnly: true } })}
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:scale-[0.99] transition-all"
            >
              <SkinScoreCircle score={latestRecord.score} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-[#8B95A1]">최근 피부 점수</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#191F28]">{Math.round(latestRecord.score)}</span>
                  <span className="text-xs text-[#B0B8C1]">/ 100</span>
                </div>
                {scoreDelta !== null && (
                  <div className="mt-1 flex items-center gap-1">
                    <TrendingUp size={12} className={scoreDelta >= 0 ? "text-[#30D158]" : "text-[#F04452]"} />
                    <span className={`text-xs font-semibold ${scoreDelta >= 0 ? "text-[#30D158]" : "text-[#F04452]"}`}>
                      {scoreDelta >= 0 ? `+${Math.round(scoreDelta)}` : Math.round(scoreDelta)}점
                    </span>
                    <span className="text-[11px] text-[#B0B8C1]">
                      · {formatRelativeDate(latestRecord.timestamp)}
                    </span>
                  </div>
                )}
              </div>
              <ArrowRight size={18} className="text-[#D1D6DB]" />
            </button>
          )}

          {/* 맞춤 화장품 추천 */}
          {latestRecord && latestRecord.categories.length > 0 && (
            <RecommendedSection categories={latestRecord.categories} />
          )}

          {/* Feature Cards — 2×2 그리드로 가독성 향상 */}
          <div>
            <h3 className="mb-3 text-[13px] font-bold text-[#8B95A1] tracking-wide">분석 항목</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Droplets, label: "피부 상태 분석", desc: "건조·색소·모공·주름·탄력", color: "#5B8CFF" },
                { icon: Search, label: "부위별 정밀 분석", desc: "이마·볼·눈가 등 9개 영역", color: "#7ED7C1" },
                { icon: FlaskConical, label: "맞춤 성분 추천", desc: "피부 타입 기반 AI 매칭", color: "#F59E0B" },
                { icon: TrendingUp, label: "변화 추적", desc: "일별·주별 피부 리포트", color: "#A78BFA" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon size={20} style={{ color: item.color }} />
                  </div>
                  <p className="mt-3 text-[14px] font-semibold leading-[1.3] text-[#191F28]">{item.label}</p>
                  <p className="mt-1 text-[12px] leading-[1.4] text-[#8B95A1]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How it Works — 간결한 스텝 */}
          <div>
            <h3 className="mb-3 text-[13px] font-bold text-[#8B95A1] tracking-wide">이용 방법</h3>
            <div className="flex items-start gap-4 rounded-2xl bg-white px-5 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              {[
                { num: "1", label: "촬영" },
                { num: "2", label: "AI 분석" },
                { num: "3", label: "결과 확인" },
              ].map((item) => (
                <div key={item.num} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5B8CFF] text-sm font-bold text-white">
                    {item.num}
                  </div>
                  <p className="mt-2 text-[13px] font-medium text-[#191F28]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
