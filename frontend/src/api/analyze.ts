import client from "./client";
import type { AnalyzeResponse } from "../types/api";

export async function analyze(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await client.post<AnalyzeResponse>("/analyze", formData);
  return data;
}

export async function recommend(
  classification: Record<string, Record<string, unknown>>,
  regression: Record<string, Record<string, unknown>>,
) {
  const { data } = await client.post("/recommend", {
    classification,
    regression,
  });
  return data;
}
