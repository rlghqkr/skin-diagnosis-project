import { useState } from "react";
import { X, Star, Check } from "lucide-react";
import type { CosmeticProduct } from "../../types/api";

interface Props {
  product: CosmeticProduct;
  onClose: () => void;
}

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

export default function ProductDetailModal({ product, onClose }: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg animate-float-in rounded-t-3xl bg-white sm:rounded-3xl sm:mx-4 max-h-[85dvh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#F2F4F6] text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
        >
          <X size={18} />
        </button>

        {/* Product image */}
        <div className="aspect-square w-full overflow-hidden rounded-t-3xl bg-[#F2F4F6] sm:rounded-t-3xl">
          {product.image_url && !imgError ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[#8B95A1]">
              이미지를 불러올 수 없습니다
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Brand & category */}
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium text-[#8B95A1]">
              {product.brand}
            </span>
            <span className="text-[#E5E8EB]">|</span>
            <span className="text-xs text-[#8B95A1]">{product.category}</span>
          </div>

          {/* Name */}
          <h3 className="mb-3 text-lg font-bold text-[#191F28]">
            {product.name}
          </h3>

          {/* Score & Price */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Star size={16} className="text-[#5B8CFF]" fill="currentColor" />
              <span className="text-sm font-bold text-[#5B8CFF]">
                적합도 {Math.round(product.match_score)}%
              </span>
            </div>
            {product.price != null && (
              <span className="text-sm font-bold text-[#191F28]">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Match reasons */}
          {product.match_reasons.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-semibold text-[#191F28]">추천 이유</h4>
              <div className="space-y-2.5">
                {product.match_reasons.map((reason, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#EBF1FF] text-[10px] font-bold text-[#5B8CFF]">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-[#4E5968]">
                      {reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key ingredients */}
          {product.key_ingredients.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-semibold text-[#191F28]">주요 성분</h4>
              <div className="flex flex-wrap gap-2">
                {product.key_ingredients.map((ingredient) => (
                  <span
                    key={ingredient}
                    className="flex items-center gap-1.5 rounded-full bg-[#F2F4F6] px-3 py-1.5 text-xs text-[#4E5968]"
                  >
                    <Check size={10} className="text-[#34C759]" />
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
