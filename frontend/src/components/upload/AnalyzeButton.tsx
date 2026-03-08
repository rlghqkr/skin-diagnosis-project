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
          ? "bg-secondary cursor-not-allowed text-muted-foreground"
          : "bg-primary text-white active:brightness-95",
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
