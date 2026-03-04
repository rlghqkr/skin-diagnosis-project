import clsx from "clsx";

interface Props {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export default function CategoryFilter({ categories, selected, onSelect }: Props) {
  return (
    <div className="scroll-x-snap gap-2 px-4 -mx-4 py-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={clsx(
          "min-h-[36px] whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all",
          selected === null
            ? "bg-[#5B8CFF] text-white"
            : "bg-[#F2F4F6] text-[#8B95A1]",
        )}
      >
        전체
      </button>

      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat === selected ? null : cat)}
          className={clsx(
            "min-h-[36px] whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all",
            cat === selected
              ? "bg-[#5B8CFF] text-white"
              : "bg-[#F2F4F6] text-[#8B95A1]",
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
