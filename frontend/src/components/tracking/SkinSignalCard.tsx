import { CheckCircle, AlertTriangle } from "lucide-react";
import type { SkinSignal } from "../../stores/useTrackingStore";

interface Props {
  signals: SkinSignal[];
}

export default function SkinSignalCard({ signals }: Props) {
  const improvements = signals.filter((s) => s.type === "improvement");
  const warnings = signals.filter((s) => s.type === "warning");

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <h3 className="mb-3 text-[13px] font-bold tracking-wide text-[#8B95A1]">
        피부 변화 신호
      </h3>
      <div className="space-y-2">
        {improvements.map((s, i) => (
          <div
            key={`imp-${i}`}
            className="flex items-start gap-3 rounded-xl bg-[#F0FDF4] px-4 py-3"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7]">
              <CheckCircle size={14} className="text-[#34C759]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#191F28]">{s.title}</p>
              <p className="mt-0.5 text-[12px] text-[#8B95A1]">{s.description}</p>
            </div>
          </div>
        ))}
        {warnings.map((s, i) => (
          <div
            key={`warn-${i}`}
            className="flex items-start gap-3 rounded-xl bg-[#FFFBEB] px-4 py-3"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7]">
              <AlertTriangle size={14} className="text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#191F28]">{s.title}</p>
              <p className="mt-0.5 text-[12px] text-[#8B95A1]">{s.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
