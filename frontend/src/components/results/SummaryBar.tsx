import type { PredictResponse, ClassificationResult, RegressionResult } from "../../types/api";
import {
  CLASS_METRICS,
  REGRESSION_METRICS,
  GRADE_DESCRIPTIONS,
  getValueStatus,
} from "../../constants/skinMetrics";
import { gradeColor } from "../../utils/gradeColor";
import { formatValue } from "../../utils/formatValue";

interface Props {
  result: PredictResponse;
}

export default function SummaryBar({ result }: Props) {
  if (result.mode === "class") {
    return <ClassificationSummary predictions={result.predictions} />;
  }
  return <RegressionSummary predictions={result.predictions} />;
}

function ClassificationSummary({
  predictions,
}: {
  predictions: Record<string, Record<string, ClassificationResult>>;
}) {
  const items = Object.entries(predictions).map(([metricKey, regions]) => {
    const meta = CLASS_METRICS[metricKey];
    const worstGrade = Math.max(...Object.values(regions).map((r) => r.grade));
    return { key: metricKey, label: meta?.label ?? metricKey, grade: worstGrade };
  });

  return (
    <div className="scroll-x-snap gap-3 pb-2">
      {items.map((item) => (
        <div
          key={item.key}
          className="card flex min-w-[200px] items-center gap-3 rounded-xl px-5 py-3"
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: gradeColor(item.grade) }}
          />
          <span className="text-sm font-medium text-cream-200/80">{item.label}</span>
          <div className="h-3 w-px bg-white/10" />
          <span
            className="text-xs font-semibold"
            style={{ color: gradeColor(item.grade) }}
          >
            {item.grade}등급
          </span>
          <span className="text-xs text-white/30">
            {GRADE_DESCRIPTIONS[item.grade]}
          </span>
        </div>
      ))}
    </div>
  );
}

function RegressionSummary({
  predictions,
}: {
  predictions: Record<string, Record<string, RegressionResult>>;
}) {
  const items = Object.entries(predictions).map(([metricKey, regions]) => {
    const meta = REGRESSION_METRICS[metricKey];
    if (!meta) return null;
    const values = Object.values(regions).map((r) => r.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const clamped = Math.max(meta.min, Math.min(avg, meta.max));
    const ratio = meta.max > meta.min ? (clamped - meta.min) / (meta.max - meta.min) : 0;
    const status = getValueStatus(ratio, meta.higherIsBetter);
    return { key: metricKey, label: meta.label, avg, unit: meta.unit, status };
  });

  return (
    <div className="scroll-x-snap gap-3 pb-2">
      {items.filter(Boolean).map((item) => (
        <div
          key={item!.key}
          className="card flex min-w-[200px] items-center gap-3 rounded-xl px-5 py-3"
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: item!.status.color }}
          />
          <span className="text-sm font-medium text-cream-200/80">{item!.label}</span>
          <div className="h-3 w-px bg-white/10" />
          <span className="text-xs font-bold" style={{ color: item!.status.color }}>
            {formatValue(item!.avg)}
            {item!.unit ? ` ${item!.unit}` : ""}
          </span>
          <span className="text-xs text-white/30">{item!.status.label}</span>
        </div>
      ))}
    </div>
  );
}
