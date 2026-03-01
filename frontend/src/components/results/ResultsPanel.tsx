import { useState } from "react";
import type { PredictResponse } from "../../types/api";
import ClassificationResults from "./ClassificationResults";
import RegressionResults from "./RegressionResults";
import RegionResults from "./RegionResults";
import SummaryBar from "./SummaryBar";
import WarningBanner from "./WarningBanner";

type ViewTab = "region" | "metric";

interface Props {
  result: PredictResponse;
  selectedRegion: string | null;
}

export default function ResultsPanel({ result, selectedRegion }: Props) {
  const [tab, setTab] = useState<ViewTab>("region");

  return (
    <div className="space-y-6 text-center">
      {/* Section header */}
      <h2 className="text-lg font-bold tracking-tight text-cream-100">
        {result.mode === "class" ? "등급 진단 결과" : "수치 측정 결과"}
      </h2>

      {/* Summary dashboard */}
      <SummaryBar result={result} />

      {result.warnings && result.warnings.length > 0 && (
        <WarningBanner warnings={result.warnings} />
      )}

      {/* Tab switcher */}
      <div className="w-full">
        <div className="card flex gap-1 rounded-xl p-1">
          <TabButton active={tab === "region"} onClick={() => setTab("region")}>
            부위별 보기
          </TabButton>
          <TabButton active={tab === "metric"} onClick={() => setTab("metric")}>
            지표별 보기
          </TabButton>
        </div>
      </div>

      {/* Results content */}
      <div className="stagger-children">
        {tab === "region" ? (
          <RegionResults result={result} selectedRegion={selectedRegion} />
        ) : result.mode === "class" ? (
          <ClassificationResults predictions={result.predictions} />
        ) : (
          <RegressionResults predictions={result.predictions} />
        )}
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
