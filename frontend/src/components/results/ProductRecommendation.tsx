import { ExternalLink } from "lucide-react";
import { useState } from "react";
import type {
  PredictResponse,
  ClassificationResult,
  RegressionResult,
} from "../../types/api";
import {
  REGRESSION_METRICS,
  GRADE_DESCRIPTIONS,
  getValueStatus,
} from "../../constants/skinMetrics";

interface Product {
  name: string;
  volume: string;
  description: string;
  image: string;
  url: string;
  tags: string[];
  store: string;
  getReasons: (result: PredictResponse) => string[];
}

/** 분류 모드에서 특정 지표의 최고(최악) 등급을 구함 */
function worstClassGrade(
  result: PredictResponse,
  metricKey: string,
): number | null {
  if (result.mode !== "class") return null;
  const regions = result.predictions[metricKey];
  if (!regions) return null;
  return Math.max(
    ...Object.values(regions as Record<string, ClassificationResult>).map(
      (r) => r.grade,
    ),
  );
}

/** 회귀 모드에서 특정 지표의 평균값과 상태를 구함 */
function avgRegValue(
  result: PredictResponse,
  metricKey: string,
): { avg: number; label: string } | null {
  if (result.mode !== "regression") return null;
  const meta = REGRESSION_METRICS[metricKey];
  const regions = result.predictions[metricKey];
  if (!meta || !regions) return null;
  const values = Object.values(
    regions as Record<string, RegressionResult>,
  ).map((r) => r.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const clamped = Math.max(meta.min, Math.min(avg, meta.max));
  const ratio =
    meta.max > meta.min ? (clamped - meta.min) / (meta.max - meta.min) : 0;
  const status = getValueStatus(ratio, meta.higherIsBetter);
  return { avg, label: status.label };
}

const PRODUCTS: Product[] = [
  {
    name: "토리든 다이브인 저분자 히알루론산 세럼",
    volume: "50ml",
    description:
      "저분자 히알루론산 5중 콤플렉스가 피부 속 깊은 곳까지 수분을 채워 촉촉하고 건강한 피부로 가꾸어주는 속보습 세럼",
    image:
      "https://cdn-image.oliveyoung.com/prdtImg/1974/e8a52989-d1e4-4f16-9a19-75ed07f7d03e.jpg?RS=600x600&AR=0&QT=80",
    url: "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000190326",
    tags: ["수분 보습", "저자극", "올리브영 1위"],
    store: "올리브영에서 보기",
    getReasons(result) {
      const reasons: string[] = [];

      if (result.mode === "class") {
        const dryness = worstClassGrade(result, "dryness");
        const wrinkle = worstClassGrade(result, "wrinkle");
        const pigmentation = worstClassGrade(result, "pigmentation");

        if (dryness !== null && dryness >= 2) {
          reasons.push(
            `건조도 ${dryness}등급(${GRADE_DESCRIPTIONS[dryness]}) — 저분자 히알루론산이 피부 깊숙이 수분을 공급하여 건조함을 개선합니다`,
          );
        }
        if (wrinkle !== null && wrinkle >= 2) {
          reasons.push(
            `주름 ${wrinkle}등급(${GRADE_DESCRIPTIONS[wrinkle]}) — 충분한 보습이 미세 주름 완화에 도움을 줍니다`,
          );
        }
        if (pigmentation !== null && pigmentation >= 3) {
          reasons.push(
            `색소침착 ${pigmentation}등급(${GRADE_DESCRIPTIONS[pigmentation]}) — 수분 장벽 강화로 외부 자극에 의한 색소 침착을 예방합니다`,
          );
        }
        if (reasons.length === 0) {
          reasons.push(
            "현재 피부 상태를 유지하기 위한 데일리 보습 세럼으로 추천합니다",
          );
        }
      } else {
        const moisture = avgRegValue(result, "moisture");
        const wrinkle = avgRegValue(result, "wrinkle_Ra");
        const elasticity = avgRegValue(result, "elasticity_R2");

        if (moisture && moisture.avg < 60) {
          reasons.push(
            `수분 평균 ${moisture.avg.toFixed(1)}%(${moisture.label}) — 저분자 히알루론산이 부족한 수분을 빠르게 보충해줍니다`,
          );
        }
        if (wrinkle && wrinkle.avg > 15) {
          reasons.push(
            `주름 수치 ${wrinkle.avg.toFixed(1)}Ra(${wrinkle.label}) — 깊은 보습으로 미세 주름 완화에 효과적입니다`,
          );
        }
        if (elasticity && elasticity.avg < 0.6) {
          reasons.push(
            `탄력 ${elasticity.avg.toFixed(2)}R2(${elasticity.label}) — 히알루론산이 피부 탄력 회복을 도와줍니다`,
          );
        }
        if (reasons.length === 0) {
          reasons.push(
            "전반적인 피부 컨디션 관리를 위한 데일리 보습 세럼으로 추천합니다",
          );
        }
      }
      return reasons;
    },
  },
  {
    name: "백아율 모이스처 밸런싱 토너",
    volume: "300ml",
    description:
      "피부 유수분 밸런스를 맞춰주는 대용량 보습 토너. 끈적이지 않고 촉촉하게 흡수되어 데일리 스킨케어 첫 단계로 추천",
    image: "/baegayul-toner.jpg",
    url: "https://www.hwahae.co.kr/goods/%EB%B0%B1%EC%95%84%EC%9C%A8-%EB%AA%A8%EC%9D%B4%EC%8A%A4%EC%B2%98-%EB%B0%B8%EB%9F%B0%EC%8B%B1-%ED%86%A0%EB%84%88-300ml/64483",
    tags: ["유수분 밸런스", "대용량", "화해 추천"],
    store: "화해에서 보기",
    getReasons(result) {
      const reasons: string[] = [];

      if (result.mode === "class") {
        const dryness = worstClassGrade(result, "dryness");
        const pore = worstClassGrade(result, "pore");
        const sagging = worstClassGrade(result, "sagging");

        if (dryness !== null && dryness >= 1) {
          reasons.push(
            `건조도 ${dryness}등급(${GRADE_DESCRIPTIONS[dryness]}) — 세안 직후 토너로 수분을 빠르게 채워 유수분 밸런스를 맞춰줍니다`,
          );
        }
        if (pore !== null && pore >= 2) {
          reasons.push(
            `모공 ${pore}등급(${GRADE_DESCRIPTIONS[pore]}) — PHA 성분이 부드러운 각질 관리와 모공 케어에 도움을 줍니다`,
          );
        }
        if (sagging !== null && sagging >= 3) {
          reasons.push(
            `처짐 ${sagging}등급(${GRADE_DESCRIPTIONS[sagging]}) — 시카·세라마이드가 피부 장벽을 강화하고 탄력을 지지합니다`,
          );
        }
        if (reasons.length === 0) {
          reasons.push(
            "건강한 피부를 유지하기 위한 스킨케어 첫 단계 토너로 추천합니다",
          );
        }
      } else {
        const moisture = avgRegValue(result, "moisture");
        const pore = avgRegValue(result, "pore");
        const pigmentation = avgRegValue(result, "pigmentation");

        if (moisture && moisture.avg < 70) {
          reasons.push(
            `수분 평균 ${moisture.avg.toFixed(1)}%(${moisture.label}) — 토너 단계에서 충분한 수분 베이스를 만들어줍니다`,
          );
        }
        if (pore && pore.avg > 800) {
          reasons.push(
            `모공 수치 ${pore.avg.toFixed(0)}(${pore.label}) — PHA 성분의 부드러운 각질 관리로 모공을 정돈합니다`,
          );
        }
        if (pigmentation && pigmentation.avg > 100) {
          reasons.push(
            `색소침착 ${pigmentation.avg.toFixed(1)}ITA°(${pigmentation.label}) — 율무 추출물이 피부 톤을 맑고 균일하게 가꿔줍니다`,
          );
        }
        if (reasons.length === 0) {
          reasons.push(
            "전반적인 피부 컨디션 관리를 위한 데일리 토너로 추천합니다",
          );
        }
      }
      return reasons;
    },
  },
];

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-dark-800 text-sm text-white/20">
        이미지를 불러올 수 없습니다
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setError(true)}
    />
  );
}

function ProductCard({
  product,
  reasons,
}: {
  product: Product;
  reasons: string[];
}) {
  return (
    <div className="card overflow-hidden rounded-2xl">
      {/* Top: product image + info */}
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        {/* Product image */}
        <div className="aspect-square w-full overflow-hidden bg-white/[0.02]">
          <ProductImage src={product.image} alt={product.name} />
        </div>

        {/* Product info */}
        <div className="p-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-rose-300/70"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="mb-1 text-sm font-semibold text-cream-200">
            {product.name}
          </h3>
          <p className="mb-2 text-xs font-light text-white/25">
            {product.volume}
          </p>
          <p className="mb-4 text-sm font-light leading-relaxed text-white/40">
            {product.description}
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-rose-400/70">
            <span className="tracking-wide">{product.store}</span>
            <ExternalLink size={13} />
          </div>
        </div>
      </a>

      {/* Bottom: recommendation reasons */}
      <div className="border-t border-white/[0.04] px-4 py-4">
        <p className="mb-3 text-xs font-medium text-white/40">
          추천 사유
        </p>
        <ul className="space-y-2.5">
          {reasons.map((reason, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-[10px] font-semibold text-rose-400/80">
                {i + 1}
              </span>
              <p className="text-sm font-light leading-relaxed text-white/50">
                {reason}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface Props {
  result: PredictResponse;
}

export default function ProductRecommendation({ result }: Props) {
  return (
    <div className="mt-12">
      {/* Section header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-cream-100">
          맞춤 제품 추천
        </h2>
        <p className="mt-1 text-xs text-white/30">
          분석 결과를 바탕으로 추천하는 제품입니다
        </p>
      </div>

      {/* Product cards */}
      <div className="flex flex-col gap-5">
        {PRODUCTS.map((product) => (
          <ProductCard
            key={product.name}
            product={product}
            reasons={product.getReasons(result)}
          />
        ))}
      </div>
    </div>
  );
}
