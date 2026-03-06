import client from "./client";

/* ── Response types matching backend schemas ── */

export interface DailySkinScoreResponse {
  score_id: string;
  user_id: string;
  measurement_id: string | null;
  score_date: string; // YYYY-MM-DD
  overall_score: number;
  hydration_norm: number | null;
  elasticity_norm: number | null;
  pore_norm: number | null;
  wrinkle_norm: number | null;
  pigmentation_norm: number | null;
  trend_direction: string | null;
  trend_velocity: number | null;
  ma_7_score: number | null;
  is_anomaly: boolean;
  created_at: string;
}

export interface TrendResponse {
  trend_direction: "improving" | "stable" | "declining";
  trend_velocity: number;
  recent_avg: number | null;
  data_points: number;
}

export interface SummaryResponse {
  period: string;
  from_date: string;
  to_date: string;
  avg_score: number | null;
  max_score: number | null;
  min_score: number | null;
  measurement_count: number;
  metric_averages: {
    hydration: number | null;
    elasticity: number | null;
    pore: number | null;
    wrinkle: number | null;
    pigmentation: number | null;
  };
}

export interface DetectionSignalsResponse {
  date: string;
  improvement: {
    detected: boolean;
    improved_metrics?: Array<{
      metric: string;
      before_mean: number;
      after_mean: number;
      change_pct: number;
    }>;
  };
  deterioration: {
    level: number;
    watch?: { deteriorated_metrics: Array<{ metric: string }> };
    warning?: { deteriorated_metrics: Array<{ metric: string }> };
    alert?: { deteriorated_metrics: Array<{ metric: string }> };
  };
  direction: "improved" | "stable" | "deteriorated";
  product_impacts: Array<{
    product_id: string;
    product_name: string;
    impact_probability: number;
    direction: string;
    affected_metrics: string[];
  }>;
}

/* ── API functions ── */

export async function getScores(params: {
  period?: "daily" | "weekly" | "monthly";
  from?: string;
  to?: string;
}): Promise<DailySkinScoreResponse[]> {
  const { data } = await client.get<DailySkinScoreResponse[]>(
    "/v1/tracking/scores",
    { params },
  );
  return data;
}

export async function getTrend(): Promise<TrendResponse> {
  const { data } = await client.get<TrendResponse>("/v1/tracking/trend");
  return data;
}

export async function getSummary(params?: {
  period?: string;
  from?: string;
  to?: string;
}): Promise<SummaryResponse> {
  const { data } = await client.get<SummaryResponse>("/v1/tracking/summary", {
    params,
  });
  return data;
}

export async function getDetectionSignals(
  targetDate?: string,
): Promise<DetectionSignalsResponse> {
  const { data } = await client.get<DetectionSignalsResponse>(
    "/v1/detection/signals",
    { params: targetDate ? { target_date: targetDate } : undefined },
  );
  return data;
}
