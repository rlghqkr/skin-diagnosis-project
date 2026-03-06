import { CheckCircle, AlertTriangle } from "lucide-react";
import type { SkinSignal } from "../../stores/useTrackingStore";

interface Props {
  signals: SkinSignal[];
}

export default function SkinSignalCard({ signals }: Props) {
  const improvements = signals.filter((s) => s.type === "improvement");
  const warnings = signals.filter((s) => s.type === "warning");

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-[#191F28]">
        피부 개선 신호
      </h3>
      <div className="space-y-2">
        {improvements.map((s, i) => (
          <div
            key={`imp-${i}`}
            className="flex gap-2.5 rounded-xl bg-[#F0FDF4] px-3 py-2.5"
          >
            <CheckCircle size={16} className="mt-0.5 shrink-0 text-[#34C759]" />
            <div className="text-xs">
              <p className="font-medium text-[#191F28]">{s.title}</p>
              <p className="mt-0.5 text-[#8B95A1]">{s.description}</p>
            </div>
          </div>
        ))}
        {warnings.map((s, i) => (
          <div
            key={`warn-${i}`}
            className="flex gap-2.5 rounded-xl bg-[#FFFBEB] px-3 py-2.5"
          >
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-[#F59E0B]"
            />
            <div className="text-xs">
              <p className="font-medium text-[#191F28]">{s.title}</p>
              <p className="mt-0.5 text-[#8B95A1]">{s.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
