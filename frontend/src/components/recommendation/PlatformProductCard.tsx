import type { RecommendedProduct } from "../../api/recommendation";
import PlatformBadge from "./PlatformBadge";

interface Props {
  product: RecommendedProduct;
}

export default function PlatformProductCard({ product }: Props) {
  const priceText =
    product.price != null
      ? `${product.price.toLocaleString("ko-KR")}원`
      : null;

  return (
    <div className="w-[156px] flex-shrink-0 snap-start rounded-2xl bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <PlatformBadge platform={product.platform} label={product.platform_label} />

      {/* Product image */}
      <div className="mt-2 aspect-square w-full overflow-hidden rounded-xl bg-[#F2F4F6]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-[#B0B8C1]">
            No Image
          </div>
        )}
      </div>

      {/* Info */}
      <p className="mt-2 truncate text-[11px] text-[#8B95A1]">{product.brand}</p>
      <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-[1.3] text-[#191F28]">
        {product.product_name}
      </p>
      {priceText && (
        <p className="mt-1 text-[13px] font-bold text-[#191F28]">{priceText}</p>
      )}
      <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.4] text-[#6B7684]">
        {product.reason}
      </p>
    </div>
  );
}
