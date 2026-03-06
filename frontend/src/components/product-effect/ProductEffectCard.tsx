import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import clsx from "clsx";
import ConfidenceBadge from "./ConfidenceBadge";
import type { Interpretation } from "../../api/product-effect";

interface Props {
  effectScore: number;
  confidence: number;
  interpretation: Interpretation;
  usageDays: number;
  productName?: string;
}

export default function ProductEffectCard({
  effectScore,
  confidence,
  interpretation,
  usageDays,
  productName,
}: Props) {
  const isPositive = effectScore > 10;
  const isNegative = effectScore < -10;

  const scoreColor = isPositive
    ? "text-[#059669]"
    : isNegative
      ? "text-[#DC2626]"
      : "text-[#6B7280]";

  const bgGradient = isPositive
    ? "from-[#ECFDF5] to-white"
    : isNegative
      ? "from-[#FEF2F2] to-white"
      : "from-[#F3F4F6] to-white";

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <div
      className={clsx(
        "rounded-2xl bg-gradient-to-br p-5 shadow-sm",
        bgGradient,
      )}
    >
      {productName && (
        <p className="mb-1 text-xs font-medium text-[#6B7280]">{productName}</p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8B95A1]">제품 효과 점수</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={clsx("text-4xl font-bold", scoreColor)}>
              {effectScore > 0 ? "+" : ""}
              {effectScore}
            </span>
            <span className="text-sm text-[#8B95A1]">/ 100</span>
          </div>
        </div>

        <div
          className={clsx(
            "flex h-14 w-14 items-center justify-center rounded-full",
            isPositive && "bg-[#D1FAE5]",
            isNegative && "bg-[#FEE2E2]",
            !isPositive && !isNegative && "bg-[#E5E7EB]",
          )}
        >
          <Icon
            size={28}
            className={clsx(
              isPositive && "text-[#059669]",
              isNegative && "text-[#DC2626]",
              !isPositive && !isNegative && "text-[#6B7280]",
            )}
          />
        </div>
      </div>

      <p className="mt-3 text-sm text-[#191F28]">{interpretation.message}</p>
      {interpretation.caveat && (
        <p className="mt-1 text-xs text-[#D97706]">{interpretation.caveat}</p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <ConfidenceBadge confidence={confidence} />
        <span className="text-xs text-[#8B95A1]">{usageDays}일 사용</span>
      </div>
    </div>
  );
}
