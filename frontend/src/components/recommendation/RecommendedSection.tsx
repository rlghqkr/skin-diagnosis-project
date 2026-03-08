import { useEffect, useRef } from "react";
import { useRecommendationStore } from "../../stores/useRecommendationStore";
import type { CategoryScoreInput } from "../../api/recommendation";
import PlatformProductCard from "./PlatformProductCard";

interface Props {
  categories: CategoryScoreInput[];
}

function SkeletonCard() {
  return (
    <div className="w-[156px] flex-shrink-0 snap-start rounded-2xl bg-white p-3 border border-border">
      <div className="h-4 w-14 animate-pulse rounded-md bg-secondary" />
      <div className="mt-2 aspect-square w-full animate-pulse rounded-xl bg-secondary" />
      <div className="mt-2 h-3 w-12 animate-pulse rounded bg-secondary" />
      <div className="mt-1 h-4 w-full animate-pulse rounded bg-secondary" />
      <div className="mt-1 h-4 w-16 animate-pulse rounded bg-secondary" />
      <div className="mt-1.5 h-3 w-full animate-pulse rounded bg-secondary" />
    </div>
  );
}

export default function RecommendedSection({ categories }: Props) {
  const { recommendation, isLoading, fetchRecommendations } =
    useRecommendationStore();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (categories.length > 0 && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchRecommendations(categories);
    }
  }, [categories, fetchRecommendations]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-[13px] font-bold text-muted-foreground tracking-wide">
          맞춤 화장품 추천
        </h3>
        {recommendation && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {recommendation.worst_metric_label} 집중 케어
          </span>
        )}
      </div>

      <div className="-mx-5 flex gap-3 overflow-x-auto scroll-smooth px-5 pb-2 snap-x snap-mandatory scrollbar-hide">
        {isLoading || !recommendation
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : recommendation.products.map((product) => (
              <PlatformProductCard key={product.platform} product={product} />
            ))}
      </div>
    </div>
  );
}
