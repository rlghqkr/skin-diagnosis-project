interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export default function SegmentedTabs({ options, value, onChange }: Props) {
  return (
    <div className="flex rounded-xl bg-secondary p-1 gap-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${
            value === option
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
