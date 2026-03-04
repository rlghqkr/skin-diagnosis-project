import { useEffect, useState } from "react";

interface Props {
  score: number;
  label?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#4ade80"; // green
  if (score >= 60) return "#e89ab5"; // rose
  if (score >= 40) return "#e8d0a8"; // gold
  return "#f87171"; // red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "매우 좋음";
  if (score >= 60) return "좋음";
  if (score >= 40) return "보통";
  if (score >= 20) return "주의";
  return "관리 필요";
}

export default function SkinScoreCircle({ score, label }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = getScoreColor(score);
  const displayLabel = label ?? getScoreLabel(score);

  // Animate score on mount
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const circumference = 2 * Math.PI * 56;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-300"
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute flex flex-col items-center">
          <span
            className="text-3xl font-bold tabular-nums"
            style={{ color }}
          >
            {animatedScore}
          </span>
          <span className="text-xs text-white/30">/ 100</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium" style={{ color }}>
        {displayLabel}
      </p>
    </div>
  );
}
