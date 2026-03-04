import { useEffect, useState } from "react";

interface Props {
  score: number;
  label?: string;
  variant?: "solid" | "projected";
  size?: "sm" | "md";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#34C759";
  if (score >= 60) return "#5B8CFF";
  if (score >= 40) return "#FF9F0A";
  return "#F04452";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "매우 좋음";
  if (score >= 60) return "좋음";
  if (score >= 40) return "보통";
  if (score >= 20) return "주의";
  return "관리 필요";
}

export default function SkinScoreCircle({ score, label, variant = "solid", size = "md" }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = getScoreColor(score);
  const displayLabel = label ?? getScoreLabel(score);
  const isProjected = variant === "projected";
  const isSmall = size === "sm";

  useEffect(() => {
    if (isProjected) {
      setAnimatedScore(score);
      return;
    }
    let frame: number;
    const start = performance.now();
    const duration = 1200;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score, isProjected]);

  const r = isSmall ? 40 : 56;
  const viewBox = isSmall ? "0 0 96 96" : "0 0 128 128";
  const cx = isSmall ? 48 : 64;
  const cy = isSmall ? 48 : 64;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (animatedScore / 100) * circumference;
  const containerClass = isSmall ? "h-24 w-24" : "h-36 w-36";

  return (
    <div className="flex flex-col items-center" style={isProjected ? { opacity: 0.65 } : undefined}>
      <div className={`relative flex items-center justify-center ${containerClass}`}>
        <svg className="h-full w-full -rotate-90" viewBox={viewBox}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#F2F4F6"
            strokeWidth={isSmall ? 5 : 6}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={isSmall ? 5 : 6}
            strokeLinecap="round"
            strokeDasharray={isProjected ? "6 4" : circumference.toString()}
            strokeDashoffset={isProjected ? 0 : offset}
            className="transition-all duration-300"
            style={isProjected ? { strokeDasharray: `${circumference}`, strokeDashoffset: offset } : undefined}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span
            className={`font-bold tabular-nums ${isSmall ? "text-xl" : "text-3xl"}`}
            style={{ color }}
          >
            {animatedScore}
          </span>
          <span className={`text-[#8B95A1] ${isSmall ? "text-[10px]" : "text-xs"}`}>/ 100</span>
        </div>
      </div>
      {!isSmall && (
        <p className="mt-2 text-sm font-semibold" style={{ color }}>
          {displayLabel}
        </p>
      )}
    </div>
  );
}
