import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { MetricDelta } from "../../api/product-effect";

const METRIC_LABELS: Record<string, string> = {
  hydration_norm: "수분",
  elasticity_norm: "탄력",
  pore_norm: "모공",
  wrinkle_norm: "주름",
  pigmentation_norm: "색소",
};

interface Props {
  metricDeltas: Record<string, MetricDelta>;
}

export default function MetricDeltaChart({ metricDeltas }: Props) {
  const data = Object.entries(metricDeltas).map(([key, d]) => ({
    name: METRIC_LABELS[key] || key,
    delta: +(d.adj_delta * 100).toFixed(1),
    direction: d.direction,
  }));

  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-[#191F28]">
        지표별 변화량
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={[-100, 100]}
              tickFormatter={(v) => `${v}`}
              tick={{ fontSize: 11, fill: "#8B95A1" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={36}
              tick={{ fontSize: 12, fill: "#191F28" }}
            />
            <Tooltip
              formatter={(value) => [`${Number(value) > 0 ? "+" : ""}${value}%`, "변화"]}
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
            />
            <ReferenceLine x={0} stroke="#D1D5DB" />
            <Bar dataKey="delta" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={
                    entry.delta > 0
                      ? "#059669"
                      : entry.delta < 0
                        ? "#EF4444"
                        : "#9CA3AF"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
