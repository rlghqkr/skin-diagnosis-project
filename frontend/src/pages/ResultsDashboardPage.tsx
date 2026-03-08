import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { RotateCcw, BarChart3 } from "lucide-react";
import type { AnalyzeResponse } from "../types/api";
import SkinScoreCircle from "../components/results/SkinScoreCircle";
import SkinRadarChart from "../components/results/SkinRadarChart";
import ImprovementPrediction from "../components/results/ImprovementPrediction";
import ClassificationResults from "../components/results/ClassificationResults";
import RegressionResults from "../components/results/RegressionResults";
import WarningBanner from "../components/results/WarningBanner";
import SegmentedTabs from "../components/common/SegmentedTabs";
import SectionCard from "../components/common/SectionCard";
import { useAnalysisHistory, getLatestAnalysis } from "../hooks/useAnalysisHistory";

type DetailTab = "classification" | "regression";

export default function ResultsDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addRecord } = useAnalysisHistory();
  const savedRef = useRef(false);

  const navState = location.state as { analyzeResult?: AnalyzeResponse; viewOnly?: boolean } | null;
  const stateResult = navState?.analyzeResult;
  const viewOnly = navState?.viewOnly ?? false;
  const analyzeResult = stateResult ?? getLatestAnalysis()?.fullResult ?? null;

  const [detailTab, setDetailTab] = useState<DetailTab>("classification");

  // Save to history only for new analysis results, not when viewing existing records
  useEffect(() => {
    if (stateResult && !savedRef.current && !viewOnly) {
      savedRef.current = true;
      addRecord(stateResult);
    }
  }, [stateResult, viewOnly, addRecord]);

  if (!analyzeResult) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-8">
        <div className="animate-float-in flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
            <BarChart3 size={28} className="text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">
            분석 결과
          </h2>
          <p className="mb-8 max-w-xs text-sm text-muted-foreground">
            사진을 촬영하거나 업로드하여 피부 분석을 시작하세요.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white active:scale-[0.98] transition-all"
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
        <h2 className="text-[20px] font-bold text-foreground">피부 분석 결과</h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground">AI가 분석한 종합 피부 진단 리포트</p>
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="mb-6">
          <WarningBanner warnings={warnings} />
        </div>
      )}

      {/* Overall score */}
      <SectionCard className="mb-6 flex flex-col items-center py-8">
        <p className="mb-4 text-[13px] font-bold tracking-wide text-muted-foreground">종합 피부 점수</p>
        <SkinScoreCircle score={score.overall} />
      </SectionCard>

      {/* Radar chart */}
      {score.categories.length > 0 && (
        <SectionCard className="mb-6">
          <SkinRadarChart categories={score.categories} />
        </SectionCard>
      )}

      {/* Improvement prediction */}
      <div className="mb-6">
        <ImprovementPrediction currentScore={score.overall} />
      </div>

      {/* Detailed results tabs */}
      <div className="mb-4">
        <h3 className="mb-3 text-[13px] font-bold tracking-wide text-muted-foreground">상세 분석</h3>
        <SegmentedTabs
          options={["등급 진단", "수치 측정"]}
          value={detailTab === "classification" ? "등급 진단" : "수치 측정"}
          onChange={(v) => setDetailTab(v === "등급 진단" ? "classification" : "regression")}
        />
      </div>

      <div className="stagger-children">
        {detailTab === "classification" ? (
          <ClassificationResults predictions={classification} />
        ) : (
          <RegressionResults predictions={regression} />
        )}
      </div>

      {/* Actions */}
      <div className="mt-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary h-[56px] text-[15px] font-semibold text-white active:scale-[0.98] transition-all"
        >
          <RotateCcw size={18} />
          새로 분석하기
        </button>
      </div>
    </div>
  );
}
