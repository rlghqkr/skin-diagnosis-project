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

/* ── Size presets (8pt grid) ── */
const SIZE_CONFIG = {
  sm: { container: "h-24 w-24", r: 40, viewBox: "0 0 96 96", cx: 48, cy: 48, stroke: 8, scoreCls: "text-[28px]", unitCls: "text-sm" },
  md: { container: "h-36 w-36", r: 56, viewBox: "0 0 128 128", cx: 64, cy: 64, stroke: 6, scoreCls: "text-3xl", unitCls: "text-xs" },
} as const;

export default function SkinScoreCircle({ score, label, variant = "solid", size = "md" }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = getScoreColor(score);
  const displayLabel = label ?? getScoreLabel(score);
  const isProjected = variant === "projected";
  const cfg = SIZE_CONFIG[size];

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

  const circumference = 2 * Math.PI * cfg.r;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center" style={isProjected ? { opacity: 0.65 } : undefined}>
      <div className={`relative flex items-center justify-center ${cfg.container}`}>
        <svg className="h-full w-full -rotate-90" viewBox={cfg.viewBox}>
          <circle
            cx={cfg.cx}
            cy={cfg.cy}
            r={cfg.r}
            fill="none"
            stroke="#F2F4F6"
            strokeWidth={cfg.stroke}
          />
          <circle
            cx={cfg.cx}
            cy={cfg.cy}
            r={cfg.r}
            fill="none"
            stroke={color}
            strokeWidth={cfg.stroke}
            strokeLinecap="round"
            strokeDasharray={isProjected ? "6 4" : circumference.toString()}
            strokeDashoffset={isProjected ? 0 : offset}
            className="transition-all duration-300"
            style={isProjected ? { strokeDasharray: `${circumference}`, strokeDashoffset: offset } : undefined}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span
            className={`font-bold tabular-nums leading-none ${cfg.scoreCls}`}
            style={{ color }}
          >
            {animatedScore}
          </span>
          <span className={`mt-0.5 text-[#8B95A1] ${cfg.unitCls}`}>/ 100</span>
        </div>
      </div>
      {size === "md" && (
        <p className="mt-2 text-sm font-semibold" style={{ color }}>
          {displayLabel}
        </p>
      )}
    </div>
  );
}
