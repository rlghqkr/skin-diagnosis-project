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

// --- /api/analyze types ---

export type SkinType = "dry" | "oily" | "combination" | "sensitive";

export type SkinConcern = "wrinkle" | "pigmentation" | "pore" | "sagging" | "dryness";

export interface Ingredient {
  name_ko: string;
  name_en: string | null;
  benefit: string;
}

export interface CosmeticProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  image_url: string | null;
  price: number | null;
  key_ingredients: string[];
  match_score: number;
  match_reasons: string[];
}

export interface ConcernRecommendation {
  concern: SkinConcern;
  severity: "low" | "moderate" | "high";
  recommended_ingredients: Ingredient[];
  products: CosmeticProduct[];
}

export interface RecommendResponse {
  skin_type: SkinType;
  primary_concerns: SkinConcern[];
  recommendations: ConcernRecommendation[];
}

export interface CategoryScore {
  category: string;
  score: number;
  label: string;
}

export interface SkinScore {
  overall: number;
  categories: CategoryScore[];
}

export interface AnalyzeResponse {
  score: SkinScore;
  classification: ClassificationPredictions;
  regression: RegressionPredictions;
  recommendation: RecommendResponse;
  warnings?: string[];
}
