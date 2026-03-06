import client from "./client";

export interface CategoryScoreInput {
  category: string;
  score: number;
  label: string;
}

export interface RecommendedProduct {
  platform: string;
  platform_label: string;
  product_name: string;
  brand: string;
  image_url: string | null;
  price: number | null;
  reason: string;
  match_score: number;
}

export interface PlatformRecommendationResponse {
  worst_metric: string;
  worst_metric_label: string;
  worst_score: number;
  products: RecommendedProduct[];
}

export async function getPlatformRecommendations(
  categories: CategoryScoreInput[],
): Promise<PlatformRecommendationResponse> {
  const { data } = await client.post<PlatformRecommendationResponse>(
    "/v1/recommendations/platform",
    categories,
  );
  return data;
}
