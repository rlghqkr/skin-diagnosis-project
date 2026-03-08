interface Props {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({ title, children, className = "" }: Props) {
  return (
    <div className={`rounded-2xl bg-card border border-border p-4 ${className}`}>
      {title && (
        <h3 className="text-[15px] font-semibold text-foreground mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
