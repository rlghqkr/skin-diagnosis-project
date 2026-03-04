import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function MetricCard({ title, children }: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <h3 className="mb-4 text-center text-sm font-semibold text-[#191F28]">
        {title}
      </h3>
      {children}
    </div>
  );
}
