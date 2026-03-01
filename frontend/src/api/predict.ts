import client from "./client";
import type { PredictMode, PredictResponse } from "../types/api";

export async function predict(
  file: File,
  mode: PredictMode,
): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);

  const { data } = await client.post<PredictResponse>("/predict", formData);
  return data;
}
