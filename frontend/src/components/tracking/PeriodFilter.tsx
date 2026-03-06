import clsx from "clsx";
import type { PeriodFilter as PeriodFilterType } from "../../stores/useTrackingStore";

const PERIODS: PeriodFilterType[] = ["1W", "1M", "3M", "6M", "1Y"];

interface Props {
  selected: PeriodFilterType;
  onChange: (p: PeriodFilterType) => void;
}

export default function PeriodFilter({ selected, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-xl bg-[#F2F4F6] p-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={clsx(
            "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            selected === p
              ? "bg-white text-[#191F28] shadow-sm"
              : "text-[#8B95A1]",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
