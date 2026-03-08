interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function StickyCTA({ children, className = "" }: Props) {
  return (
    <div
      className={`sticky bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-6 ${className}`}
    >
      {children}
    </div>
  );
}
