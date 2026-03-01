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
    <div className="card flex w-full gap-1 rounded-xl p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={clsx(
            "relative flex flex-1 min-h-[48px] items-center justify-center rounded-lg px-5 py-2.5 text-sm transition-all duration-200",
            mode === opt.value
              ? "bg-rose-500/10 text-cream-200"
              : "text-white/35 hover:text-white/55",
          )}
          onClick={() => onChange(opt.value)}
        >
          <span className="font-medium tracking-wide">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
