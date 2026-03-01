import { AlertTriangle, X } from "lucide-react";

interface Props {
  message: string;
  onClose: () => void;
}

export default function ErrorAlert({ message, onClose }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/15 bg-red-500/[0.04] px-4 py-3">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400/70" />
      <p className="flex-1 text-sm font-light text-red-300/80">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400/40 transition-colors hover:bg-red-400/10 hover:text-red-300"
      >
        <X size={14} />
      </button>
    </div>
  );
}
