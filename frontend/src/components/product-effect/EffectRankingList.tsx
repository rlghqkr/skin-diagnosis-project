import { ChevronRight, Trophy } from "lucide-react";
import clsx from "clsx";
import type { RankedProduct } from "../../api/product-effect";

interface Props {
  ranking: RankedProduct[];
  onSelect: (productId: string) => void;
}

const MEDAL_COLORS = ["text-[#F59E0B]", "text-[#9CA3AF]", "text-[#CD7F32]"];

export default function EffectRankingList({ ranking, onSelect }: Props) {
  if (ranking.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-center text-sm text-[#8B95A1]">
          아직 분석된 제품이 없어요.
          <br />
          제품을 14일 이상 사용하면 효과 분석이 시작됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm">
      <h3 className="px-4 pt-4 text-sm font-bold text-[#191F28]">
        내 제품 효과 랭킹
      </h3>

      <div className="mt-2 divide-y divide-[#F3F4F6]">
        {ranking.map((item, idx) => {
          const isPositive = item.effect_score > 10;
          const isNegative = item.effect_score < -10;

          return (
            <button
              key={item.product_id}
              onClick={() => onSelect(item.product_id)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[#F9FAFB] active:bg-[#F3F4F6]"
            >
              {/* Rank */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                {idx < 3 ? (
                  <Trophy size={20} className={MEDAL_COLORS[idx]} />
                ) : (
                  <span className="text-sm font-bold text-[#8B95A1]">
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#191F28]">
                  {item.product_name}
                </p>
                <p className="text-xs text-[#8B95A1]">
                  {item.brand} · {item.category}
                </p>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "text-base font-bold",
                    isPositive && "text-[#059669]",
                    isNegative && "text-[#DC2626]",
                    !isPositive && !isNegative && "text-[#6B7280]",
                  )}
                >
                  {item.effect_score > 0 ? "+" : ""}
                  {item.effect_score}
                </span>
                <ChevronRight size={16} className="text-[#D1D5DB]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
