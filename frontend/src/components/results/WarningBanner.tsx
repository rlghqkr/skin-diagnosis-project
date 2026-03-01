import { AlertTriangle } from "lucide-react";

interface Props {
  warnings: string[];
}

export default function WarningBanner({ warnings }: Props) {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] px-5 py-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-400/70">
        <AlertTriangle size={14} />
        <span className="tracking-wide">경고</span>
      </div>
      <ul className="list-inside list-disc space-y-1 text-xs font-light text-amber-300/50">
        {warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </div>
  );
}
