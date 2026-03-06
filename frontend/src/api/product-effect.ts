import client from "./client";

/* ── Response types ── */

export interface MetricDelta {
  before_avg: number;
  after_avg: number;
  delta: number;
  adj_delta: number;
  seasonal_adjustment: number;
  direction: "improved" | "declined" | "unchanged";
  significance?: {
    metric: string;
    p_value: number;
    is_significant: boolean;
    effect_size: number;
    effect_label: string;
  };
}

export interface Interpretation {
  label: string;
  message: string;
  caveat?: string;
}

export interface ProductEffectResponse {
  analysis_id: string;
  effect_score: number;
  metric_deltas: Record<string, MetricDelta>;
  confidence: number;
  method: string;
  interpretation: Interpretation;
  usage_days: number;
  sample_count: number;
  significance: Array<{
    metric: string;
    p_value: number;
    is_significant: boolean;
    effect_size: number;
    effect_label: string;
  }>;
}

export interface RankedProduct {
  product_id: string;
  product_name: string;
  brand: string;
  category: string;
  effect_score: number;
  confidence_level: number;
  usage_duration_days: number;
  interpretation: Interpretation;
}

export interface CompareResponse {
  products: Array<{
    product_id: string;
    product_name: string | null;
    brand?: string;
    effect_score?: number;
    confidence_level?: number;
    metric_deltas?: Record<string, MetricDelta>;
    usage_duration_days?: number;
    error?: string;
  }>;
}

/* ── API functions ── */

export async function getProductEffect(
  productId: string,
): Promise<ProductEffectResponse> {
  const { data } = await client.get<ProductEffectResponse>(
    `/v1/products/${productId}/effect`,
  );
  return data;
}

export async function getProductRanking(
  minConfidence = 0.3,
): Promise<RankedProduct[]> {
  const { data } = await client.get<RankedProduct[]>(
    "/v1/users/me/products/ranking",
    { params: { min_confidence: minConfidence } },
  );
  return data;
}

export async function compareProducts(
  productIds: string[],
): Promise<CompareResponse> {
  const { data } = await client.post<CompareResponse>(
    "/v1/products/compare",
    { product_ids: productIds },
  );
  return data;
}
