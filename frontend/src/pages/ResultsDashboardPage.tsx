import { useLocation, useNavigate } from "react-router-dom";
import { RotateCcw, BarChart3 } from "lucide-react";
import type { AnalyzeResponse } from "../types/api";
import SkinScoreCircle from "../components/results/SkinScoreCircle";
import SkinRadarChart from "../components/results/SkinRadarChart";
import ClassificationResults from "../components/results/ClassificationResults";
import RegressionResults from "../components/results/RegressionResults";
import WarningBanner from "../components/results/WarningBanner";
import { useState } from "react";

type DetailTab = "classification" | "regression";

export default function ResultsDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const analyzeResult = (location.state as { analyzeResult?: AnalyzeResponse } | null)?.analyzeResult;
  const [detailTab, setDetailTab] = useState<DetailTab>("classification");

  if (!analyzeResult) {
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

  const { score, classification, regression, warnings } = analyzeResult;

  return (
    <div className="animate-float-in px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-cream-200">피부 분석 결과</h2>
        <p className="mt-1 text-xs text-white/30">AI가 분석한 종합 피부 진단 리포트</p>
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="mb-6">
          <WarningBanner warnings={warnings} />
        </div>
      )}

      {/* Overall score */}
      <div className="card mb-6 flex flex-col items-center rounded-2xl py-8">
        <p className="mb-4 text-xs font-medium tracking-wide text-white/40">종합 피부 점수</p>
        <SkinScoreCircle score={score.overall} />
      </div>

      {/* Radar chart */}
      {score.categories.length > 0 && (
        <div className="mb-6">
          <SkinRadarChart categories={score.categories} />
        </div>
      )}

      {/* Detailed results tabs */}
      <div className="mb-4">
        <h3 className="mb-3 text-sm font-medium text-cream-200/80">상세 분석</h3>
        <div className="card flex gap-1 rounded-xl p-1">
          <TabButton active={detailTab === "classification"} onClick={() => setDetailTab("classification")}>
            등급 진단
          </TabButton>
          <TabButton active={detailTab === "regression"} onClick={() => setDetailTab("regression")}>
            수치 측정
          </TabButton>
        </div>
      </div>

      <div className="stagger-children">
        {detailTab === "classification" ? (
          <ClassificationResults predictions={classification} />
        ) : (
          <RegressionResults predictions={regression} />
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate("/recommendations", { state: { analyzeResult } })}
          className="btn-primary flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-medium text-white shadow-lg shadow-rose-500/15"
        >
          맞춤 화장품 추천 보기
        </button>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="card card-hover flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-medium text-white/50"
        >
          <RotateCcw size={15} />
          새로 분석하기
        </button>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`flex-1 min-h-[44px] rounded-lg px-4 py-2.5 text-sm font-medium tracking-wide transition-all duration-200 ${
        active
          ? "bg-rose-500/10 text-cream-200 shadow-sm"
          : "text-white/30 hover:text-white/50"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
