import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, FlaskConical, ChevronRight } from "lucide-react";
import { useTrackingStore } from "../stores/useTrackingStore";
import PeriodFilter from "../components/tracking/PeriodFilter";
import DailyScoreCard from "../components/tracking/DailyScoreCard";
import ScoreTrendLine from "../components/tracking/ScoreTrendLine";
import MetricDetailChart from "../components/tracking/MetricDetailChart";
import ProductChangeMarker from "../components/tracking/ProductChangeMarker";
import SkinSignalCard from "../components/tracking/SkinSignalCard";
import WeeklySummaryCard from "../components/tracking/WeeklySummaryCard";

export default function TrackingPage() {
  const {
    productChanges,
    signals,
    selectedPeriod,
    isLoading,
    error,
    setPeriod,
    getFilteredScores,
    fetchScores,
    fetchSignals,
  } = useTrackingStore();

  useEffect(() => {
    fetchScores();
    fetchSignals();
  }, [fetchScores, fetchSignals]);

  const filtered = getFilteredScores();
  const today = filtered.length > 0 ? filtered[filtered.length - 1] : null;
  const yesterday = filtered.length > 1 ? filtered[filtered.length - 2] : null;

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
      <h1 className="mb-4 text-lg font-bold text-[#191F28]">Skin Trend</h1>

      {/* Period filter */}
      <PeriodFilter selected={selectedPeriod} onChange={setPeriod} />

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-8 flex justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B82F6]" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded-xl bg-[#FEF2F2] px-4 py-3 text-xs text-[#EF4444]">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {/* Today's score */}
        {today && <DailyScoreCard today={today} yesterday={yesterday} />}

        {/* Weekly summary */}
        <WeeklySummaryCard data={filtered} />

        {/* Overall trend chart */}
        <ScoreTrendLine data={filtered} productChanges={productChanges} />

        {/* Metric detail chart */}
        <MetricDetailChart data={filtered} />

        {/* Product changes */}
        <ProductChangeMarker changes={productChanges} />

        {/* Skin signals */}
        <SkinSignalCard signals={signals} />

        {/* Product effect link */}
        <Link
          to="/product-effect"
          className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#EEF2FF] to-white p-4 shadow-sm transition-colors hover:from-[#E0E7FF]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C7D2FE]">
              <FlaskConical size={20} className="text-[#4F46E5]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#191F28]">제품 효과 분석</p>
              <p className="text-xs text-[#8B95A1]">내 제품이 피부에 얼마나 효과적인지 확인</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#8B95A1]" />
        </Link>
      </div>
    </div>
  );
}
