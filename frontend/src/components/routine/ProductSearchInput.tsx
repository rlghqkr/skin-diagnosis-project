import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, X, Plus, Loader2 } from "lucide-react";
import clsx from "clsx";
import type { Product } from "../../stores/useRoutineStore";
import { searchProducts, type ProductResponse } from "../../api/product";
import cosmeticsData from "../../../../data/cosmetics.json";

const CATEGORIES = [
  "전체",
  "클렌저",
  "토너",
  "세럼/에센스",
  "크림/로션",
  "선크림",
  "마스크팩",
  "아이크림",
] as const;

interface CosmeticItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  rating?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export default function ProductSearchInput({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [apiResults, setApiResults] = useState<ProductResponse[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [useApi, setUseApi] = useState(!!localStorage.getItem("access_token"));

  const localProducts = (cosmeticsData as { products: CosmeticItem[] }).products;

  // API search with debounce
  const searchApi = useCallback(async (q: string) => {
    if (!q.trim() || !useApi) return;
    setApiLoading(true);
    try {
      const results = await searchProducts(q.trim());
      setApiResults(results);
    } catch {
      // Fallback to local data on API error
      setUseApi(false);
    } finally {
      setApiLoading(false);
    }
  }, [useApi]);

  useEffect(() => {
    if (!query.trim() || !useApi) {
      setApiResults([]);
      return;
    }
    const timer = setTimeout(() => searchApi(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchApi, useApi]);

  // Local fallback filtering
  const localFiltered = useMemo(() => {
    if (useApi && query.trim()) return []; // API mode handles search
    let list = localProducts;
    if (selectedCategory !== "전체") {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q),
      );
    }
    return list.slice(0, 20);
  }, [query, selectedCategory, localProducts, useApi]);

  // Combine: API results take priority when available
  const displayItems = useMemo(() => {
    if (useApi && query.trim() && apiResults.length > 0) {
      return apiResults.map((p) => ({
        id: p.product_id,
        name: p.product_name,
        brand: p.brand,
        category: p.category,
        rating: null as number | null,
      }));
    }
    return localFiltered.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      rating: p.rating ?? null,
    }));
  }, [useApi, query, apiResults, localFiltered]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedCategory("전체");
      setApiResults([]);
      setUseApi(!!localStorage.getItem("access_token"));
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#E5E8EB] px-4 py-3">
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#8B95A1] active:bg-[#F2F4F6]">
          <X size={22} />
        </button>
        <h2 className="flex-1 text-base font-bold text-[#191F28]">
          제품 검색
        </h2>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-[#F2F4F6] px-3 py-2.5">
          {apiLoading ? (
            <Loader2 size={18} className="animate-spin text-[#5B8CFF]" />
          ) : (
            <Search size={18} className="text-[#8B95A1]" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="브랜드명 또는 제품명"
            className="flex-1 bg-transparent text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none"
            autoFocus
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="flex h-8 w-8 items-center justify-center text-[#B0B8C1]">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category filter (local mode only) */}
      {!useApi && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={clsx(
                "flex-shrink-0 rounded-full px-4 py-2.5 text-[12px] font-medium transition-colors",
                selectedCategory === cat
                  ? "bg-[#5B8CFF] text-white"
                  : "bg-[#F2F4F6] text-[#6B7684]",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {displayItems.length === 0 && !apiLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search size={40} className="mb-3 text-[#D1D6DB]" />
            <p className="text-sm text-[#8B95A1]">
              {query.trim() ? "검색 결과가 없습니다" : "제품을 검색해주세요"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect({
                    id: item.id,
                    name: item.name,
                    brand: item.brand,
                    category: item.category,
                  });
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#F7F9FC] px-4 py-4 text-left transition-colors active:bg-[#EBF1FF]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#191F28] truncate">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#8B95A1]">
                    {item.brand} · {item.category}
                    {item.rating != null && ` · ★ ${item.rating}`}
                  </p>
                </div>
                <Plus size={18} className="flex-shrink-0 text-[#5B8CFF]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
