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
      {/* Hero Section — compact, top-aligned */}
      <div className="px-4 pt-6">
        <div className="w-full max-w-md mx-auto text-center">
          {/* Gradient icon — 16px to title */}
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, #EBF1FF, #E0F5EE)" }}
          >
            <Sparkles size={26} className="text-[#5B8CFF]" />
          </div>

          {/* Title — 8px to description */}
          <h2 className="mb-2 text-2xl font-bold leading-[1.4] tracking-tight text-[#191F28]">
            AI 피부 분석
          </h2>

          {/* Description — 14px, line-height 1.4 */}
          <p className="mx-auto max-w-xs text-sm leading-[1.4] text-[#8B95A1]">
            사진 한 장으로 피부 상태를 정밀하게 분석하고
            <br />
            맞춤 화장품을 추천받으세요
          </p>
          <p className="mx-auto mt-1 text-xs text-[#B0B8C1]">
            5개 항목 · 9개 부위 · 무료
          </p>

          {/* CTA Button — 24px from description, full width, h-[52px] */}
          <button
            type="button"
            onClick={onOpenPhotoSheet}
            className="mt-6 flex w-full items-center justify-center rounded-2xl px-5 h-[52px] text-base font-semibold text-white shadow-[0_4px_16px_rgba(91,140,255,0.25)] active:brightness-95 transition-all"
            style={{ background: "linear-gradient(135deg, #5B8CFF, #7ED7C1)" }}
          >
            피부 분석 시작하기
          </button>
        </div>
      </div>

      {/* ── 32px gap ── */}

      {/* Daily Skin Score (if history exists) */}
      {latestRecord && (
        <div className="mt-8 px-4">
          <div className="flex min-h-[140px] items-center gap-5 rounded-[20px] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <SkinScoreCircle score={latestRecord.score} size="sm" />
            <div className="flex-1">
              <h3 className="text-[13px] font-bold text-[#191F28]">피부 점수</h3>
              <span className="text-[11px] text-[#8B95A1]">
                마지막 분석: {formatRelativeDate(latestRecord.timestamp)}
              </span>
              {scoreDelta !== null && (
                <p className={`mt-1 text-sm font-semibold ${scoreDelta >= 0 ? "text-[#30D158]" : "text-[#F04452]"}`}>
                  {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta}점 {scoreDelta >= 0 ? "개선" : "변화"}
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate("/results/dashboard", { state: { analyzeResult: latestRecord.fullResult } })}
                className="mt-2 text-[13px] font-medium text-[#5B8CFF]"
              >
                결과 보기 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 24px gap ── */}

      {/* Feature Preview Cards — 16px padding, 16px gap, 8pt grid */}
      <div className={latestRecord ? "mt-6 px-4" : "mt-8 px-4"}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Droplets, label: "피부 상태 분석", desc: "5가지 지표" },
            { icon: Search, label: "부위별 정밀 분석", desc: "9개 얼굴 영역" },
            { icon: FlaskConical, label: "맞춤 성분 추천", desc: "AI 성분 매칭" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center rounded-2xl bg-white p-4 text-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF1FF]">
                <item.icon size={20} className="text-[#5B8CFF]" />
              </div>
              <span className="mt-3 text-[13px] font-medium leading-[1.4] text-[#191F28]">{item.label}</span>
              <span className="mt-1.5 text-[11px] leading-[1.4] text-[#8B95A1]">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 24px gap ── */}

      {/* How it works — 16px step spacing, 36px icon */}
      <div className="mt-6 px-4 pb-8">
        <h3 className="mb-4 text-base font-bold text-[#191F28]">이용 방법</h3>
        <div className="space-y-4">
          {[
            { step: "1", title: "사진 촬영", desc: "정면 얼굴 사진을 촬영하거나 업로드하세요" },
            { step: "2", title: "AI 분석", desc: "딥러닝 모델이 피부 상태를 정밀 분석합니다" },
            { step: "3", title: "결과 확인", desc: "분석 결과와 맞춤 화장품 추천을 확인하세요" },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#5B8CFF] text-sm font-bold text-white">
                {item.step}
              </div>
              <div className="flex-1">
                <p className="text-base font-medium leading-[1.4] text-[#191F28]">{item.title}</p>
                <p className="mt-1 text-[13px] leading-[1.4] text-[#8B95A1]">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-[#D1D6DB]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
