import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import type { MetricDelta } from "../../api/product-effect";

const METRIC_LABELS: Record<string, string> = {
  hydration_norm: "수분",
  elasticity_norm: "탄력",
  pore_norm: "모공",
  wrinkle_norm: "주름",
  pigmentation_norm: "색소",
};

interface Props {
  metricDeltas: Record<string, MetricDelta>;
}

export default function BeforeAfterCompare({ metricDeltas }: Props) {
  const metrics = Object.entries(metricDeltas);

  if (metrics.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-[#191F28]">Before / After</h3>
      <div className="space-y-3">
        {metrics.map(([key, d]) => {
          const label = METRIC_LABELS[key] || key;
          const changePct = ((d.delta / (d.before_avg || 1)) * 100).toFixed(1);
          const isImproved = d.direction === "improved";
          const isDeclined = d.direction === "declined";

          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-10 text-xs font-medium text-[#6B7280]">
                {label}
              </span>

              <div className="flex flex-1 items-center gap-2">
                <span className="min-w-[40px] text-right text-sm text-[#8B95A1]">
                  {d.before_avg.toFixed(2)}
                </span>
                <ArrowRight size={14} className="text-[#D1D5DB]" />
                <span
                  className={clsx(
                    "min-w-[40px] text-sm font-semibold",
                    isImproved && "text-[#059669]",
                    isDeclined && "text-[#DC2626]",
                    !isImproved && !isDeclined && "text-[#6B7280]",
                  )}
                >
                  {d.after_avg.toFixed(2)}
                </span>
              </div>

              <span
                className={clsx(
                  "min-w-[48px] text-right text-xs font-medium",
                  isImproved && "text-[#059669]",
                  isDeclined && "text-[#DC2626]",
                  !isImproved && !isDeclined && "text-[#6B7280]",
                )}
              >
                {isImproved ? "+" : ""}
                {changePct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
