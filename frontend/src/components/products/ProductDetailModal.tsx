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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg animate-float-in rounded-t-3xl bg-dark-900 sm:rounded-3xl sm:mx-4 max-h-[85dvh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 transition-colors hover:bg-white/10"
        >
          <X size={18} />
        </button>

        {/* Product image */}
        <div className="aspect-square w-full overflow-hidden rounded-t-3xl bg-dark-800 sm:rounded-t-3xl">
          {product.image_url && !imgError ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/20">
              이미지를 불러올 수 없습니다
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Brand & category */}
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium tracking-wide text-white/30">
              {product.brand}
            </span>
            <span className="text-white/10">|</span>
            <span className="text-xs text-white/25">{product.category}</span>
          </div>

          {/* Name */}
          <h3 className="mb-3 text-lg font-semibold text-cream-200">
            {product.name}
          </h3>

          {/* Score & Price */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Star size={16} className="text-gold-400" fill="currentColor" />
              <span className="text-sm font-semibold text-gold-400">
                적합도 {Math.round(product.match_score)}%
              </span>
            </div>
            {product.price != null && (
              <span className="text-sm font-semibold text-cream-200/80">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Match reasons */}
          {product.match_reasons.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-medium text-white/50">추천 이유</h4>
              <div className="space-y-2.5">
                {product.match_reasons.map((reason, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-[10px] font-semibold text-rose-400/80">
                      {i + 1}
                    </span>
                    <p className="text-sm font-light leading-relaxed text-white/50">
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
              <h4 className="mb-3 text-sm font-medium text-white/50">주요 성분</h4>
              <div className="flex flex-wrap gap-2">
                {product.key_ingredients.map((ingredient) => (
                  <span
                    key={ingredient}
                    className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-white/50"
                  >
                    <Check size={10} className="text-emerald-400/60" />
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
