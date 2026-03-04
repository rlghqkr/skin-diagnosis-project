import { useState } from "react";
import { Star } from "lucide-react";
import type { CosmeticProduct } from "../../types/api";

interface Props {
  product: CosmeticProduct;
  onSelect: (product: CosmeticProduct) => void;
}

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

export default function ProductCard({ product, onSelect }: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="card card-hover flex w-full gap-4 rounded-2xl p-4 text-left transition-all"
    >
      {/* Product image */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-dark-800">
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/20">
            이미지 없음
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="text-[10px] font-medium tracking-wide text-white/30">
            {product.brand}
          </p>
          <p className="mt-0.5 text-sm font-medium leading-tight text-cream-200">
            {product.name}
          </p>
          <p className="mt-1 text-xs text-white/25">{product.category}</p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          {/* Price */}
          {product.price != null && (
            <span className="text-sm font-semibold text-cream-200/80">
              {formatPrice(product.price)}
            </span>
          )}

          {/* Match score */}
          <div className="flex items-center gap-1">
            <Star size={12} className="text-gold-400" fill="currentColor" />
            <span className="text-xs font-medium text-gold-400">
              {Math.round(product.match_score)}%
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
