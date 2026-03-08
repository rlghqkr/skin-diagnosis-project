import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Sparkles } from "lucide-react";
import type { AnalyzeResponse, CosmeticProduct, SkinConcern } from "../types/api";
import ProductCard from "../components/products/ProductCard";
import ProductDetailModal from "../components/products/ProductDetailModal";
import CategoryFilter from "../components/products/CategoryFilter";

const CONCERN_LABELS: Record<SkinConcern, string> = {
  wrinkle: "주름",
  pigmentation: "색소침착",
  pore: "모공",
  sagging: "탄력",
  dryness: "건조",
};

const SEVERITY_LABELS: Record<string, string> = {
  low: "낮음",
  moderate: "보통",
  high: "높음",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-primary bg-accent",
  moderate: "text-[#FF9F0A] bg-[#FFF8E1]",
  high: "text-[#F04452] bg-[#FFF0F0]",
};

const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: "건성",
  oily: "지성",
  combination: "복합성",
  sensitive: "민감성",
};

export default function RecommendationsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const analyzeResult = (location.state as { analyzeResult?: AnalyzeResponse } | null)?.analyzeResult;

  const [selectedProduct, setSelectedProduct] = useState<CosmeticProduct | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const allProducts = useMemo(() => {
    if (!analyzeResult) return [];
    return analyzeResult.recommendation.recommendations.flatMap((r) => r.products);
  }, [analyzeResult]);

  const categories = useMemo(() => {
    const cats = new Set(allProducts.map((p) => p.category));
    return Array.from(cats);
  }, [allProducts]);

  if (!analyzeResult) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-8">
        <div className="animate-float-in flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
            <ShoppingBag size={28} className="text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">
            맞춤 추천
          </h2>
          <p className="mb-8 max-w-xs text-sm text-muted-foreground">
            피부 분석을 완료하면 분석 결과에 맞는
            화장품을 추천해드립니다.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white"
          >
            <Sparkles size={16} />
            분석 시작하기
          </button>
        </div>
      </div>
    );
  }

  const { recommendation } = analyzeResult;

  return (
    <div className="animate-float-in px-5 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">맞춤 화장품 추천</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          분석 결과를 바탕으로 추천하는 제품입니다
        </p>
      </div>

      {/* Skin type badge */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-card px-4 py-3 border border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
          <Sparkles size={14} className="text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">피부 타입</p>
          <p className="text-sm font-semibold text-foreground">
            {SKIN_TYPE_LABELS[recommendation.skin_type] ?? recommendation.skin_type}
          </p>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="mb-6">
          <CategoryFilter
            categories={categories}
            selected={categoryFilter}
            onSelect={setCategoryFilter}
          />
        </div>
      )}

      {/* Concern-based recommendations */}
      <div className="space-y-8">
        {recommendation.recommendations.map((concern) => {
          const filteredProducts = categoryFilter
            ? concern.products.filter((p) => p.category === categoryFilter)
            : concern.products;

          if (filteredProducts.length === 0) return null;

          return (
            <div key={concern.concern}>
              {/* Concern header */}
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  {CONCERN_LABELS[concern.concern] ?? concern.concern}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    SEVERITY_COLORS[concern.severity] ?? ""
                  }`}
                >
                  {SEVERITY_LABELS[concern.severity] ?? concern.severity}
                </span>
              </div>

              {/* Recommended ingredients */}
              {concern.recommended_ingredients.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {concern.recommended_ingredients.map((ing) => (
                    <span
                      key={ing.name_ko}
                      className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium text-primary"
                      title={ing.benefit}
                    >
                      {ing.name_ko}
                    </span>
                  ))}
                </div>
              )}

              {/* Product cards */}
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={setSelectedProduct}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
