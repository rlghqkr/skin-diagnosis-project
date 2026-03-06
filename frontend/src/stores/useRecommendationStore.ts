import { create } from "zustand";
import {
  type CategoryScoreInput,
  type PlatformRecommendationResponse,
  getPlatformRecommendations,
} from "../api/recommendation";

interface RecommendationState {
  recommendation: PlatformRecommendationResponse | null;
  isLoading: boolean;
  error: string | null;
  /** Tracks whether a fetch has been attempted at least once */
  hasFetched: boolean;
  fetchRecommendations: (categories: CategoryScoreInput[]) => Promise<void>;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  recommendation: null,
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchRecommendations: async (categories) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getPlatformRecommendations(categories);
      set({ recommendation: data, isLoading: false, hasFetched: true });
    } catch {
      set({ error: "추천 정보를 불러오지 못했습니다", isLoading: false, hasFetched: true });
    }
  },
}));
