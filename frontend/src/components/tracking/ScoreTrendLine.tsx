import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type {
  DailyScore,
  ProductChangeEvent,
} from "../../stores/useTrackingStore";

interface Props {
  data: DailyScore[];
  productChanges: ProductChangeEvent[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DailyScore }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-[#191F28]">{formatDate(d.date)}</p>
      <p className="mt-1 text-[#3B82F6]">점수: {d.overall_score}</p>
      {d.ma_7_score !== null && (
        <p className="text-[#F59E0B]">7일 평균: {d.ma_7_score}</p>
      )}
    </div>
  );
}

export default function ScoreTrendLine({ data, productChanges }: Props) {
  const filteredChanges = productChanges.filter((pc) => {
    const pcDate = pc.date;
    return (
      data.length > 0 &&
      pcDate >= data[0].date &&
      pcDate <= data[data.length - 1].date
    );
  });

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <h3 className="mb-3 text-[13px] font-bold tracking-wide text-[#8B95A1]">
        종합 피부 점수
      </h3>
      <ResponsiveContainer width="100%" height={220}>
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
            domain={[40, 100]}
            tick={{ fill: "#8B95A1", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Product change markers */}
          {filteredChanges.map((pc) => (
            <ReferenceLine
              key={pc.date}
              x={pc.date}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `🔺`,
                position: "top",
                fontSize: 12,
              }}
            />
          ))}

          {/* 7-day moving average */}
          <Line
            type="monotone"
            dataKey="ma_7_score"
            stroke="#F59E0B"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            connectNulls
            name="7일 평균"
          />

          {/* Actual score */}
          <Line
            type="monotone"
            dataKey="overall_score"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3B82F6" }}
            name="점수"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Stats row */}
      {data.length > 0 && (
        <div className="mt-3 flex justify-center gap-4 text-xs text-[#8B95A1]">
          <span>
            평균:{" "}
            <strong className="text-[#191F28]">
              {Math.round(
                data.reduce((s, d) => s + d.overall_score, 0) / data.length,
              )}
            </strong>
          </span>
          <span>
            최고:{" "}
            <strong className="text-[#191F28]">
              {Math.max(...data.map((d) => d.overall_score))}
            </strong>
          </span>
          <span>
            최저:{" "}
            <strong className="text-[#191F28]">
              {Math.min(...data.map((d) => d.overall_score))}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
