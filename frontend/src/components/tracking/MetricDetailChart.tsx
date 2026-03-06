import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import clsx from "clsx";
import type { DailyScore, MetricKey } from "../../stores/useTrackingStore";

interface Props {
  data: DailyScore[];
}

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: "moisture_norm", label: "수분", color: "#3B82F6" },
  { key: "elasticity_norm", label: "탄력", color: "#8B5CF6" },
  { key: "pore_norm", label: "모공", color: "#F59E0B" },
  { key: "wrinkle_norm", label: "주름", color: "#EF4444" },
  { key: "pigmentation_norm", label: "색소", color: "#EC4899" },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getTrend(data: DailyScore[], key: MetricKey): { label: string; color: string } {
  if (data.length < 7) return { label: "데이터 부족", color: "#8B95A1" };
  const recent = data.slice(-7);
  const older = data.slice(-14, -7);
  if (older.length === 0) return { label: "안정적", color: "#8B95A1" };

  const recentAvg = recent.reduce((s, d) => s + d[key], 0) / recent.length;
  const olderAvg = older.reduce((s, d) => s + d[key], 0) / older.length;
  const diff = recentAvg - olderAvg;

  if (diff > 0.03) return { label: "▲ 개선 추세", color: "#34C759" };
  if (diff < -0.03) return { label: "▼ 하락 추세", color: "#EF4444" };
  return { label: "─ 안정적", color: "#8B95A1" };
}

export default function MetricDetailChart({ data }: Props) {
  const [active, setActive] = useState<MetricKey>("moisture_norm");
  const activeMetric = METRICS.find((m) => m.key === active)!;
  const trend = getTrend(data, active);

  const currentVal = data.length > 0 ? data[data.length - 1][active] : 0;
  const avgVal =
    data.length > 0
      ? data.reduce((s, d) => s + d[active], 0) / data.length
      : 0;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <h3 className="mb-4 text-[15px] font-bold text-[#191F28]">
        항목별 상세
      </h3>

      {/* Metric tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setActive(m.key)}
            className={clsx(
              "flex shrink-0 items-center gap-1.5 rounded-full px-4 min-h-[44px] text-[13px] font-semibold transition-all active:scale-[0.96]",
              active === m.key
                ? "text-white shadow-sm"
                : "bg-[#F2F4F6] text-[#4E5968] active:bg-[#E5E8EB]",
            )}
            style={active === m.key ? { backgroundColor: m.color } : undefined}
          >
            <span
              className={clsx(
                "h-2 w-2 rounded-full shrink-0",
                active === m.key && "bg-white/60",
              )}
              style={active !== m.key ? { backgroundColor: m.color } : undefined}
            />
            {m.label}
          </button>
        ))}
      </div>

      {/* Current stats */}
      <div className="mb-3 flex items-center gap-4">
        <div>
          <p className="text-[12px] font-medium text-[#8B95A1]">
            {activeMetric.label}
          </p>
          <p className="text-2xl font-bold text-[#191F28]">
            {Math.round(currentVal * 100)}
          </p>
        </div>
        <div className="text-[12px] text-[#8B95A1]">
          <p>
            평균:{" "}
            <strong className="text-[#191F28]">
              {Math.round(avgVal * 100)}
            </strong>
          </p>
          <p style={{ color: trend.color }}>{trend.label}</p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: -15, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F6" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: "#8B95A1", fontSize: 10 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v: number) => `${Math.round(v * 100)}`}
            tick={{ fill: "#8B95A1", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [
              `${Math.round(Number(value) * 100)}점`,
              activeMetric.label,
            ]}
            labelFormatter={(label) => formatDate(String(label))}
          />
          <Line
            type="monotone"
            dataKey={active}
            stroke={activeMetric.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: activeMetric.color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
