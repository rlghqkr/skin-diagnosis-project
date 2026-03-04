import clsx from "clsx";

interface Props {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export default function CategoryFilter({ categories, selected, onSelect }: Props) {
  return (
    <div className="scroll-x-snap gap-2 px-4 -mx-4 py-1">
      {/* All button */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={clsx(
          "min-h-[36px] whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-all",
          selected === null
            ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
            : "bg-white/[0.03] text-white/40 border border-white/[0.06]",
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
            "min-h-[36px] whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-all",
            cat === selected
              ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
              : "bg-white/[0.03] text-white/40 border border-white/[0.06]",
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
