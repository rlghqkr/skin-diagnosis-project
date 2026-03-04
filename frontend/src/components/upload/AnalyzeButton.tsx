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
        "flex w-full items-center justify-center gap-2.5 rounded-2xl px-14 py-4 min-h-[52px] text-base font-semibold transition-all",
        disabled || loading
          ? "bg-[#F2F4F6] cursor-not-allowed text-[#8B95A1]"
          : "bg-[#5B8CFF] text-white shadow-[0_4px_16px_rgba(91,140,255,0.3)] active:brightness-95",
      )}
    >
      {loading ? (
        <>
          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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
