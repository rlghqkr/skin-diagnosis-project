import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function MetricCard({ title, children }: Props) {
  return (
    <div className="card rounded-xl p-4">
      <h3 className="mb-4 text-center text-sm font-semibold tracking-wide text-cream-200">
        {title}
      </h3>
      {children}
    </div>
  );
}
