import clsx from "clsx";
import type { PredictMode } from "../../types/api";

interface Props {
  mode: PredictMode;
  onChange: (mode: PredictMode) => void;
}

const OPTIONS: { value: PredictMode; label: string }[] = [
  { value: "class", label: "등급 진단" },
  { value: "regression", label: "수치 측정" },
];

export default function ModeSelector({ mode, onChange }: Props) {
  return (
    <div className="flex w-full gap-1 rounded-2xl bg-[#F2F4F6] p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={clsx(
            "relative flex flex-1 min-h-[44px] items-center justify-center rounded-xl px-5 py-2.5 text-sm transition-all duration-200",
            mode === opt.value
              ? "bg-white text-[#191F28] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
              : "text-[#8B95A1] hover:text-[#4E5968]",
          )}
          onClick={() => onChange(opt.value)}
        >
          <span className="font-medium">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
