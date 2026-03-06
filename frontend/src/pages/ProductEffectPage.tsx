import { useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProductEffectStore } from "../stores/useProductEffectStore";
import EffectRankingList from "../components/product-effect/EffectRankingList";
import ProductEffectCard from "../components/product-effect/ProductEffectCard";
import BeforeAfterCompare from "../components/product-effect/BeforeAfterCompare";
import MetricDeltaChart from "../components/product-effect/MetricDeltaChart";

export default function ProductEffectPage() {
  const navigate = useNavigate();
  const {
    ranking,
    selectedEffect,
    isLoading,
    error,
    fetchRanking,
    fetchProductEffect,
    clearError,
  } = useProductEffectStore();

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const handleSelect = (productId: string) => {
    fetchProductEffect(productId);
  };

  const handleBack = () => {
    if (selectedEffect) {
      useProductEffectStore.setState({ selectedEffect: null });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#F3F4F6]"
        >
          <ArrowLeft size={20} className="text-[#191F28]" />
        </button>
        <h1 className="text-lg font-bold text-[#191F28]">
          {selectedEffect ? "제품 효과 분석" : "제품 효과"}
        </h1>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="mt-8 flex justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B82F6]" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl bg-[#FEF2F2] px-4 py-3 text-xs text-[#EF4444]">
          {error}
          <button
            onClick={clearError}
            className="ml-2 underline"
          >
            닫기
          </button>
        </div>
      )}

      {/* Detail view */}
      {selectedEffect && !isLoading && (
        <div className="space-y-4">
          <ProductEffectCard
            effectScore={selectedEffect.effect_score}
            confidence={selectedEffect.confidence}
            interpretation={selectedEffect.interpretation}
            usageDays={selectedEffect.usage_days}
          />
          <BeforeAfterCompare metricDeltas={selectedEffect.metric_deltas} />
          <MetricDeltaChart metricDeltas={selectedEffect.metric_deltas} />
        </div>
      )}

      {/* Ranking list */}
      {!selectedEffect && !isLoading && (
        <EffectRankingList ranking={ranking} onSelect={handleSelect} />
      )}
    </div>
  );
}
