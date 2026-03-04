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
      className="flex w-full gap-4 rounded-2xl bg-white p-4 text-left shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all active:scale-[0.98]"
    >
      {/* Product image */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-[#F2F4F6]">
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[#8B95A1]">
            이미지 없음
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="text-[10px] font-medium text-[#8B95A1]">
            {product.brand}
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-tight text-[#191F28]">
            {product.name}
          </p>
          <p className="mt-1 text-xs text-[#8B95A1]">{product.category}</p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          {product.price != null && (
            <span className="text-sm font-bold text-[#191F28]">
              {formatPrice(product.price)}
            </span>
          )}

          <div className="flex items-center gap-1">
            <Star size={12} className="text-[#5B8CFF]" fill="currentColor" />
            <span className="text-xs font-semibold text-[#5B8CFF]">
              {Math.round(product.match_score)}%
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
