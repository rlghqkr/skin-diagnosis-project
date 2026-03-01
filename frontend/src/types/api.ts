export interface HealthResponse {
  status: string;
  device: string;
  models_loaded: Record<string, string[]>;
}

export interface ClassificationResult {
  grade: number;
  probabilities: number[];
}

export interface RegressionResult {
  value: number;
}

export type ClassificationPredictions = Record<
  string,
  Record<string, ClassificationResult>
>;

export type RegressionPredictions = Record<
  string,
  Record<string, RegressionResult>
>;

export interface ClassificationResponse {
  mode: "class";
  predictions: ClassificationPredictions;
  warnings?: string[];
}

export interface RegressionResponse {
  mode: "regression";
  predictions: RegressionPredictions;
  warnings?: string[];
}

export type PredictResponse = ClassificationResponse | RegressionResponse;

export type PredictMode = "class" | "regression";
