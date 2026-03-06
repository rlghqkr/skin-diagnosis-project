/**
 * Client-side fallback recommendation engine.
 * Used when the backend API is unavailable (e.g., not deployed yet).
 * Mirrors the backend algorithm: find worst metric → pick best product per platform.
 */

import type {
  CategoryScoreInput,
  PlatformRecommendationResponse,
  RecommendedProduct,
} from "../api/recommendation";

// Korean category → English metric
const CATEGORY_TO_METRIC: Record<string, string> = {
  수분: "hydration",
  탄력: "elasticity",
  모공: "pore",
  주름: "wrinkle",
  색소: "pigmentation",
  건조: "hydration",
  탄성: "elasticity",
};

const METRIC_TO_LABEL: Record<string, string> = {
  hydration: "수분",
  elasticity: "탄력",
  pore: "모공",
  wrinkle: "주름",
  pigmentation: "색소",
};

interface ProductEntry {
  platform: string;
  platform_label: string;
  brand: string;
  product_name: string;
  price: number;
  image_url: string;
  key_ingredients: string[];
  targets: string[];
}

// Curated best products per platform per metric (pre-scored)
const PRODUCT_DB: ProductEntry[] = [
  // ── oliveyoung ──
  { platform: "oliveyoung", platform_label: "올리브영", brand: "라운드랩", product_name: "독도 토너", price: 18000, image_url: "https://placehold.co/300x300/e8f5e9/2DB400?text=독도토너", key_ingredients: ["Hyaluronic Acid", "Ceramide"], targets: ["hydration", "elasticity"] },
  { platform: "oliveyoung", platform_label: "올리브영", brand: "넘버즈인", product_name: "3번 비타민C 세럼", price: 18000, image_url: "https://placehold.co/300x300/e8f5e9/2DB400?text=3번세럼", key_ingredients: ["Vitamin C", "Niacinamide"], targets: ["pigmentation"] },
  { platform: "oliveyoung", platform_label: "올리브영", brand: "아누아", product_name: "어성초 토너", price: 20000, image_url: "https://placehold.co/300x300/e8f5e9/2DB400?text=어성초토너", key_ingredients: ["Niacinamide", "AHA"], targets: ["pore", "pigmentation"] },
  { platform: "oliveyoung", platform_label: "올리브영", brand: "AHC", product_name: "바이탈 골든 콜라겐 크림", price: 28000, image_url: "https://placehold.co/300x300/e8f5e9/2DB400?text=골든콜라겐", key_ingredients: ["Peptide", "Retinol"], targets: ["wrinkle", "elasticity"] },
  // ── hwahae ──
  { platform: "hwahae", platform_label: "화해", brand: "아이소이", product_name: "액티 히알루론 크림", price: 38000, image_url: "https://placehold.co/300x300/fce4ec/FF6B9D?text=히알루론크림", key_ingredients: ["Hyaluronic Acid", "Ceramide"], targets: ["hydration", "elasticity"] },
  { platform: "hwahae", platform_label: "화해", brand: "오쏘몰", product_name: "비타민C 세럼", price: 32000, image_url: "https://placehold.co/300x300/fce4ec/FF6B9D?text=비타민C세럼", key_ingredients: ["Vitamin C", "Niacinamide"], targets: ["pigmentation"] },
  { platform: "hwahae", platform_label: "화해", brand: "메디큐브", product_name: "제로모공패드", price: 24000, image_url: "https://placehold.co/300x300/fce4ec/FF6B9D?text=제로모공", key_ingredients: ["AHA", "Salicylic Acid", "Niacinamide"], targets: ["pore"] },
  { platform: "hwahae", platform_label: "화해", brand: "레티놀시카", product_name: "리페어 세럼", price: 28000, image_url: "https://placehold.co/300x300/fce4ec/FF6B9D?text=레티놀세럼", key_ingredients: ["Retinol", "Peptide"], targets: ["wrinkle", "elasticity"] },
  // ── daiso ──
  { platform: "daiso", platform_label: "다이소", brand: "VT", product_name: "시카 수분 크림", price: 3000, image_url: "https://placehold.co/300x300/e3f2fd/0064FF?text=시카수분크림", key_ingredients: ["Ceramide", "Hyaluronic Acid"], targets: ["hydration", "elasticity"] },
  { platform: "daiso", platform_label: "다이소", brand: "손앤박", product_name: "비타민C 토너", price: 3000, image_url: "https://placehold.co/300x300/e3f2fd/0064FF?text=비타C토너", key_ingredients: ["Vitamin C", "Niacinamide"], targets: ["pigmentation"] },
  { platform: "daiso", platform_label: "다이소", brand: "손앤박", product_name: "글리콜산 토너", price: 3000, image_url: "https://placehold.co/300x300/e3f2fd/0064FF?text=글리콜토너", key_ingredients: ["Glycolic Acid", "AHA"], targets: ["pore", "pigmentation"] },
  { platform: "daiso", platform_label: "다이소", brand: "VT", product_name: "레티놀 크림", price: 3000, image_url: "https://placehold.co/300x300/e3f2fd/0064FF?text=레티놀크림", key_ingredients: ["Retinol", "Peptide"], targets: ["wrinkle", "elasticity"] },
  // ── internal (Our AI) ──
  { platform: "internal", platform_label: "Our AI", brand: "NIA Lab", product_name: "하이드라 부스트 세럼", price: 35000, image_url: "https://placehold.co/300x300/e8eaf6/5B8CFF?text=하이드라부스트", key_ingredients: ["Hyaluronic Acid", "Ceramide", "Peptide"], targets: ["hydration", "elasticity"] },
  { platform: "internal", platform_label: "Our AI", brand: "NIA Lab", product_name: "브라이트닝 비타C 앰플", price: 38000, image_url: "https://placehold.co/300x300/e8eaf6/5B8CFF?text=브라이트닝", key_ingredients: ["Vitamin C", "Niacinamide", "Glycolic Acid"], targets: ["pigmentation"] },
  { platform: "internal", platform_label: "Our AI", brand: "NIA Lab", product_name: "포어 리파인 세럼", price: 32000, image_url: "https://placehold.co/300x300/e8eaf6/5B8CFF?text=포어리파인", key_ingredients: ["Niacinamide", "Salicylic Acid", "AHA"], targets: ["pore"] },
  { platform: "internal", platform_label: "Our AI", brand: "NIA Lab", product_name: "안티링클 레티놀 세럼", price: 40000, image_url: "https://placehold.co/300x300/e8eaf6/5B8CFF?text=안티링클", key_ingredients: ["Retinol", "Peptide", "Vitamin C"], targets: ["wrinkle", "elasticity"] },
];

// Ingredient → metric effects (same as backend INGREDIENT_EFFECT_MAP)
const INGREDIENT_EFFECTS: Record<string, Record<string, number>> = {
  Niacinamide: { pigmentation: 0.8, pore: 0.6, hydration: 0.3 },
  Retinol: { wrinkle: 0.9, elasticity: 0.7, pigmentation: 0.4 },
  "Hyaluronic Acid": { hydration: 0.9, elasticity: 0.3 },
  "Salicylic Acid": { pore: 0.8, wrinkle: 0.2 },
  "Vitamin C": { pigmentation: 0.9, elasticity: 0.4 },
  Ceramide: { hydration: 0.8, elasticity: 0.5 },
  AHA: { pore: 0.7, pigmentation: 0.5, wrinkle: 0.3 },
  Peptide: { wrinkle: 0.8, elasticity: 0.7 },
  "Green Tea Seed Oil": { hydration: 0.5 },
  "Glycolic Acid": { pore: 0.7, pigmentation: 0.5, wrinkle: 0.3 },
};

function findWorstMetric(categories: CategoryScoreInput[]): {
  metric: string;
  label: string;
  score: number;
} {
  let worstScore = Infinity;
  let worstMetric = "hydration";
  let worstLabel = "수분";

  for (const cat of categories) {
    const metric = CATEGORY_TO_METRIC[cat.category];
    if (metric && cat.score < worstScore) {
      worstScore = cat.score;
      worstMetric = metric;
      worstLabel = cat.category;
    }
  }

  return { metric: worstMetric, label: worstLabel, score: worstScore };
}

function getTargetIngredients(metric: string): [string, number][] {
  const result: [string, number][] = [];
  for (const [ingredient, effects] of Object.entries(INGREDIENT_EFFECTS)) {
    if (effects[metric]) {
      result.push([ingredient, effects[metric]]);
    }
  }
  return result.sort((a, b) => b[1] - a[1]);
}

function generateReason(
  keyIngredients: string[],
  metric: string,
  targetIngredients: [string, number][],
): string {
  const targetNames = new Set(targetIngredients.map(([name]) => name));
  const matched = keyIngredients.filter((ing) => targetNames.has(ing));
  const metricLabel = METRIC_TO_LABEL[metric] || metric;

  if (matched.length > 0) {
    return `${matched.slice(0, 2).join(", ")} 성분이 ${metricLabel} 개선에 도움을 줍니다`;
  }
  return `${metricLabel} 케어에 적합한 제품입니다`;
}

export function getFallbackRecommendations(
  categories: CategoryScoreInput[],
): PlatformRecommendationResponse {
  const { metric, label, score } = findWorstMetric(categories);
  const targetIngredients = getTargetIngredients(metric);

  const platforms = ["oliveyoung", "hwahae", "daiso", "internal"];
  const products: RecommendedProduct[] = [];

  for (const platform of platforms) {
    // Find products for this platform that target the worst metric
    const candidates = PRODUCT_DB.filter(
      (p) => p.platform === platform && p.targets.includes(metric),
    );

    // Fallback: any product from this platform
    const pool = candidates.length > 0
      ? candidates
      : PRODUCT_DB.filter((p) => p.platform === platform);

    if (pool.length === 0) continue;

    // Score and pick best
    const scored = pool.map((p) => {
      const totalWeight = targetIngredients.reduce((s, [, w]) => s + w, 0);
      const matchedWeight = targetIngredients
        .filter(([n]) => p.key_ingredients.includes(n))
        .reduce((s, [, w]) => s + w, 0);
      const ingredientScore = totalWeight > 0 ? matchedWeight / totalWeight : 0;
      return { product: p, score: ingredientScore * 0.7 + 0.3 };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    products.push({
      platform: best.product.platform,
      platform_label: best.product.platform_label,
      product_name: best.product.product_name,
      brand: best.product.brand,
      image_url: best.product.image_url,
      price: best.product.price,
      reason: generateReason(
        best.product.key_ingredients,
        metric,
        targetIngredients,
      ),
      match_score: Math.round(best.score * 100) / 100,
    });
  }

  return {
    worst_metric: metric,
    worst_metric_label: label,
    worst_score: score,
    products,
  };
}
