import type { ClassificationPredictions } from "../../types/api";
import { CLASS_METRICS } from "../../constants/skinMetrics";
import MetricCard from "./MetricCard";
import GradeBar from "./GradeBar";
import GradeBadge from "./GradeBadge";
import FaceRegionLabel from "./FaceRegionLabel";

interface Props {
  predictions: ClassificationPredictions;
}

export default function ClassificationResults({ predictions }: Props) {
  const metrics = Object.entries(predictions);

  return (
    <div className="flex flex-col gap-3">
      {metrics.map(([metricKey, regions]) => {
        const meta = CLASS_METRICS[metricKey];
        return (
          <MetricCard key={metricKey} title={meta?.label ?? metricKey}>
            <div className="space-y-4">
              {Object.entries(regions).map(([region, result]) => (
                <div key={region}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <FaceRegionLabel region={region} />
                    <GradeBadge grade={result.grade} />
                  </div>
                  <GradeBar probabilities={result.probabilities} />
                  <div className="mt-1 flex justify-between text-[9px] text-[#8B95A1]">
                    {result.probabilities.map((p, i) => (
                      <span key={i}>{(p * 100).toFixed(0)}%</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </MetricCard>
        );
      })}
    </div>
  );
}
