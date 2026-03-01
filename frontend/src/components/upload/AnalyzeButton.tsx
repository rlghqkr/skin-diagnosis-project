import { Sparkles } from "lucide-react";
import clsx from "clsx";

interface Props {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}

export default function AnalyzeButton({ onClick, loading, disabled }: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        "btn-primary group flex w-full items-center justify-center gap-2.5 rounded-xl px-14 py-4 min-h-[52px] text-base font-medium tracking-wide transition-all",
        disabled || loading
          ? "!bg-white/5 !shadow-none cursor-not-allowed text-white/20"
          : "text-white shadow-lg shadow-rose-500/15",
      )}
    >
      {loading ? (
        <>
          <div className="h-4 w-4 rounded-full border border-white/30 border-t-transparent animate-spin" />
          분석 중...
        </>
      ) : (
        <>
          <Sparkles size={16} />
          피부 분석 시작
        </>
      )}
    </button>
  );
}
