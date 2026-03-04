import { AlertTriangle } from "lucide-react";

interface Props {
  warnings: string[];
}

export default function WarningBanner({ warnings }: Props) {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[#FFF8E1] px-5 py-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#FF9F0A]">
        <AlertTriangle size={14} />
        <span>경고</span>
      </div>
      <ul className="list-inside list-disc space-y-1 text-xs text-[#4E5968]">
        {warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </div>
  );
}
