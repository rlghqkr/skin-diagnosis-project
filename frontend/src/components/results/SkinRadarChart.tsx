import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { CategoryScore } from "../../types/api";

const CATEGORY_LABELS: Record<string, string> = {
  moisture: "수분",
  wrinkle: "주름",
  pigmentation: "색소",
  pore: "모공",
  sagging: "탄력",
  elasticity: "탄성",
  dryness: "건조",
};

interface Props {
  categories: CategoryScore[];
}

export default function SkinRadarChart({ categories }: Props) {
  const data = categories.map((cat) => ({
    subject: CATEGORY_LABELS[cat.category] ?? cat.category,
    score: cat.score,
    fullMark: 100,
  }));

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <h3 className="mb-2 text-center text-sm font-semibold text-foreground">
        카테고리별 점수
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "var(--secondary-foreground)", fontSize: 12 }}
          />
          <Radar
            name="피부 점수"
            dataKey="score"
            stroke="#3182F6"
            fill="#3182F6"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <div
            key={cat.category}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5"
          >
            <span className="text-xs text-muted-foreground">
              {CATEGORY_LABELS[cat.category] ?? cat.category}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {Math.round(cat.score)}
            </span>
            <span className="text-[10px] text-muted-foreground">{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
