const PLATFORM_COLORS: Record<string, string> = {
  oliveyoung: "#2DB400",
  hwahae: "#FF6B9D",
  daiso: "#0064FF",
  internal: "#5B8CFF",
};

interface Props {
  platform: string;
  label: string;
}

export default function PlatformBadge({ platform, label }: Props) {
  const color = PLATFORM_COLORS[platform] ?? "#8B95A1";

  return (
    <span
      className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold leading-[16px]"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {label}
    </span>
  );
}
