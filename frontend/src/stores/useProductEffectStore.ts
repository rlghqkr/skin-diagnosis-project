import { create } from "zustand";
import {
  getProductEffect,
  getProductRanking,
  compareProducts,
  type ProductEffectResponse,
  type RankedProduct,
  type CompareResponse,
} from "../api/product-effect";

interface ProductEffectState {
  ranking: RankedProduct[];
  selectedEffect: ProductEffectResponse | null;
  comparison: CompareResponse | null;
  isLoading: boolean;
  error: string | null;

  fetchRanking: (minConfidence?: number) => Promise<void>;
  fetchProductEffect: (productId: string) => Promise<void>;
  fetchComparison: (productIds: string[]) => Promise<void>;
  clearError: () => void;
}

export const useProductEffectStore = create<ProductEffectState>((set) => ({
  ranking: [],
  selectedEffect: null,
  comparison: null,
  isLoading: false,
  error: null,

  fetchRanking: async (minConfidence = 0.3) => {
    set({ isLoading: true, error: null });
    try {
      const ranking = await getProductRanking(minConfidence);
      set({ ranking, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.detail || "랭킹을 불러올 수 없습니다",
        isLoading: false,
      });
    }
  },

  fetchProductEffect: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const effect = await getProductEffect(productId);
      set({ selectedEffect: effect, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.detail || "효과 분석을 불러올 수 없습니다",
        isLoading: false,
      });
    }
  },

  fetchComparison: async (productIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const comparison = await compareProducts(productIds);
      set({ comparison, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.detail || "비교 결과를 불러올 수 없습니다",
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
