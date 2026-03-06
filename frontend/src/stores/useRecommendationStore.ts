import { create } from "zustand";
import {
  type CategoryScoreInput,
  type PlatformRecommendationResponse,
  getPlatformRecommendations,
} from "../api/recommendation";
import { getFallbackRecommendations } from "../services/fallbackRecommendation";

interface RecommendationState {
  recommendation: PlatformRecommendationResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchRecommendations: (categories: CategoryScoreInput[]) => Promise<void>;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  recommendation: null,
  isLoading: false,
  error: null,

  fetchRecommendations: async (categories) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getPlatformRecommendations(categories);
      set({ recommendation: data, isLoading: false });
    } catch {
      // API failed → use client-side fallback
      const fallback = getFallbackRecommendations(categories);
      set({ recommendation: fallback, isLoading: false });
    }
  },
}));
