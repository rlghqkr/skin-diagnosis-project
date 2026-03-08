export type StatusLevel = "양호" | "경미" | "보통" | "주의" | "나쁨" | "심각";

export function getStatusColor(status: StatusLevel) {
  switch (status) {
    case "양호":
      return { bg: "var(--status-good-bg)", text: "var(--status-good-text)" };
    case "경미":
      return { bg: "var(--status-mild-bg)", text: "var(--status-mild-text)" };
    case "보통":
      return { bg: "var(--status-normal-bg)", text: "var(--status-normal-text)" };
    case "주의":
      return { bg: "var(--status-caution-bg)", text: "var(--status-caution-text)" };
    case "나쁨":
      return { bg: "var(--status-bad-bg)", text: "var(--status-bad-text)" };
    case "심각":
      return { bg: "var(--status-severe-bg)", text: "var(--status-severe-text)" };
    default:
      return { bg: "var(--status-normal-bg)", text: "var(--status-normal-text)" };
  }
}

export function getStatusFillColor(status: StatusLevel): string {
  switch (status) {
    case "양호": return "#4CAF50";
    case "경미": return "#66BB6A";
    case "보통": return "#8B95A1";
    case "주의": return "#FFA726";
    case "나쁨": return "#EF5350";
    case "심각": return "#C62828";
    default: return "#8B95A1";
  }
}

interface Props {
  label: string;
  status: StatusLevel;
}

export default function StatusBadge({ label, status }: Props) {
  const colors = getStatusColor(status);
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  );
}
