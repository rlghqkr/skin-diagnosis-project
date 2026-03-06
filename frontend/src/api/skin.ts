import client from "./client";

/* ── Types matching backend SkinMeasurement schema ── */

export interface SkinMeasurementResponse {
  measurement_id: string;
  user_id: string;
  measured_at: string;
  hydration_score: number;
  elasticity_score: number;
  pore_score: number;
  wrinkle_score: number;
  pigmentation_score: number;
  overall_skin_score: number;
  classification_data: Record<string, unknown> | null;
  regression_data: Record<string, unknown> | null;
  image_url: string | null;
  capture_metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SkinMeasurementPayload {
  user_id: string;
  hydration_score: number;
  elasticity_score: number;
  pore_score: number;
  wrinkle_score: number;
  pigmentation_score: number;
  overall_skin_score: number;
  classification_data?: Record<string, unknown> | null;
  regression_data?: Record<string, unknown> | null;
  image_url?: string | null;
  capture_metadata?: Record<string, unknown> | null;
}

/** Save a skin measurement (auto-creates daily_skin_score on the backend). */
export async function saveMeasurement(
  payload: SkinMeasurementPayload,
): Promise<SkinMeasurementResponse> {
  const { data } = await client.post<SkinMeasurementResponse>(
    "/v1/skin/measure",
    payload,
  );
  return data;
}

/** Get the latest measurement for the current user. */
export async function getLatestMeasurement(): Promise<SkinMeasurementResponse | null> {
  const { data } = await client.get<SkinMeasurementResponse | null>(
    "/v1/skin/latest",
  );
  return data;
}
