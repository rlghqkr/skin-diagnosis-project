import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function MetricCard({ title, children }: Props) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <h3 className="mb-4 text-center text-sm font-semibold text-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}
