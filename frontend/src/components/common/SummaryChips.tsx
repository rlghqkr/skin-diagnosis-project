interface Props {
  chips: string[];
}

export default function SummaryChips({ chips }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
      {chips.map((chip) => {
        const isWarning = chip.includes("나쁨") || chip.includes("심각") || chip.includes("주의");
        return (
          <span
            key={chip}
            className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap"
            style={{
              backgroundColor: isWarning ? "var(--status-caution-bg)" : "var(--status-normal-bg)",
              color: isWarning ? "var(--status-caution-text)" : "var(--status-normal-text)",
            }}
          >
            {chip}
          </span>
        );
      })}
    </div>
  );
}
