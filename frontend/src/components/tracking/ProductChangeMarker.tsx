import { ArrowRight } from "lucide-react";
import type { ProductChangeEvent } from "../../stores/useTrackingStore";

interface Props {
  changes: ProductChangeEvent[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function ProductChangeMarker({ changes }: Props) {
  if (changes.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-[#191F28]">
        제품 변경 이력
      </h3>
      <div className="space-y-3">
        {changes.map((c) => (
          <div
            key={c.date + c.category}
            className="flex items-center gap-3 rounded-xl bg-[#FEF2F2] px-3 py-2.5"
          >
            <span className="text-sm">🔺</span>
            <div className="flex-1 text-xs">
              <p className="font-medium text-[#191F28]">
                {formatDate(c.date)} · {c.category}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[#8B95A1]">
                {c.previous_product ? (
                  <>
                    <span>{c.previous_product}</span>
                    <ArrowRight size={10} />
                    <span className="font-medium text-[#191F28]">
                      {c.new_product}
                    </span>
                  </>
                ) : (
                  <span className="font-medium text-[#191F28]">
                    {c.new_product} 추가
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
