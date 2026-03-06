import { Check, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { RoutineStep } from "../../stores/useRoutineStore";

const CATEGORY_ICONS: Record<string, string> = {
  "클렌저": "🧴",
  "토너": "💧",
  "세럼/에센스": "💎",
  "크림/로션": "🧈",
  "선크림": "☀️",
  "마스크팩": "🎭",
  "아이크림": "👁️",
};

interface Props {
  step: RoutineStep;
  onToggle: () => void;
  onRemove: () => void;
}

export default function RoutineStepCard({ step, onToggle, onRemove }: Props) {
  const icon = CATEGORY_ICONS[step.product.category] ?? "✨";

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all",
        step.completed && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={clsx(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          step.completed
            ? "border-[#5B8CFF] bg-[#5B8CFF]"
            : "border-[#D1D6DB] bg-white",
        )}
      >
        {step.completed && <Check size={14} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-[11px] font-medium text-[#8B95A1]">
            {step.product.category}
          </span>
        </div>
        <p
          className={clsx(
            "mt-0.5 text-[14px] font-medium leading-[1.4] truncate",
            step.completed ? "text-[#8B95A1] line-through" : "text-[#191F28]",
          )}
        >
          {step.product.brand} {step.product.name}
        </p>
        <span className="text-[11px] text-[#B0B8C1]">
          사용: {step.daysUsed}일째
        </span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[#D1D6DB] transition-colors hover:text-[#F04452]"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
