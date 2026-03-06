import clsx from "clsx";

interface Props {
  confidence: number;
  className?: string;
}

export default function ConfidenceBadge({ confidence, className }: Props) {
  const pct = Math.round(confidence * 100);
  const level =
    pct >= 70 ? "high" : pct >= 40 ? "medium" : "low";

  const styles = {
    high: "bg-[#ECFDF5] text-[#059669]",
    medium: "bg-[#FFFBEB] text-[#D97706]",
    low: "bg-[#FEF2F2] text-[#DC2626]",
  };

  const labels = {
    high: "신뢰도 높음",
    medium: "신뢰도 보통",
    low: "데이터 부족",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        styles[level],
        className,
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          level === "high" && "bg-[#059669]",
          level === "medium" && "bg-[#D97706]",
          level === "low" && "bg-[#DC2626]",
        )}
      />
      {labels[level]} {pct}%
    </span>
  );
}
