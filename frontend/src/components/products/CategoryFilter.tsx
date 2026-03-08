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
          "min-h-[44px] whitespace-nowrap rounded-full px-4 py-3 text-xs font-medium transition-all",
          selected === null
            ? "bg-primary text-white"
            : "bg-secondary text-muted-foreground",
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
            "min-h-[44px] whitespace-nowrap rounded-full px-4 py-3 text-xs font-medium transition-all",
            cat === selected
              ? "bg-primary text-white"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
