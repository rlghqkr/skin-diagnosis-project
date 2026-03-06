import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, FlaskConical, ChevronRight, TrendingUp } from "lucide-react";
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
    <div className="flex min-h-[calc(100dvh-120px)] flex-col pb-24">
      {/* Page header */}
      <div className="bg-white px-5 pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #EBF1FF, #E8E0FF)" }}
          >
            <TrendingUp size={20} className="text-[#5B8CFF]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#191F28]">피부 트렌드</h1>
            <p className="text-[12px] text-[#8B95A1]">피부 변화를 한눈에 확인하세요</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#F7F9FC] px-5 pt-5">
        <div className="mx-auto w-full max-w-lg space-y-4">
          {/* Period filter */}
          <PeriodFilter selected={selectedPeriod} onChange={setPeriod} />

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[#3B82F6]" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-2xl bg-[#FEF2F2] px-4 py-3 text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          {!isLoading && (
            <>
              {/* Hero scores — 오늘 + 주간을 나란히 */}
              {today && (
                <div className="grid grid-cols-2 gap-3">
                  <DailyScoreCard today={today} yesterday={yesterday} />
                  <WeeklySummaryCard data={filtered} />
                </div>
              )}

              {/* Trend chart */}
              <ScoreTrendLine data={filtered} productChanges={productChanges} />

              {/* Metric breakdown */}
              <MetricDetailChart data={filtered} />

              {/* Signals — 변화 감지 */}
              {signals.length > 0 && <SkinSignalCard signals={signals} />}

              {/* Product changes */}
              {productChanges.length > 0 && <ProductChangeMarker changes={productChanges} />}

              {/* Product effect CTA */}
              <Link
                to="/product-effect"
                className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#EEF2FF] to-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all active:scale-[0.99]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C7D2FE]">
                  <FlaskConical size={20} className="text-[#4F46E5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#191F28]">제품 효과 분석</p>
                  <p className="text-[12px] text-[#8B95A1]">내 제품의 피부 개선 효과 확인</p>
                </div>
                <ChevronRight size={18} className="text-[#D1D6DB]" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
