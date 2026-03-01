import type { RegressionPredictions } from "../../types/api";
import { REGRESSION_METRICS } from "../../constants/skinMetrics";
import MetricCard from "./MetricCard";
import ValueGauge from "./ValueGauge";
import FaceRegionLabel from "./FaceRegionLabel";

interface Props {
  predictions: RegressionPredictions;
}

export default function RegressionResults({ predictions }: Props) {
  const metrics = Object.entries(predictions);

  return (
    <div className="flex flex-col gap-3">
      {metrics.map(([metricKey, regions]) => {
        const meta = REGRESSION_METRICS[metricKey];
        if (!meta) return null;
        return (
          <MetricCard key={metricKey} title={meta.label}>
            <div className="space-y-4">
              {Object.entries(regions).map(([region, result]) => (
                <div key={region}>
                  <FaceRegionLabel region={region} />
                  <ValueGauge
                    value={result.value}
                    min={meta.min}
                    max={meta.max}
                    unit={meta.unit}
                    higherIsBetter={meta.higherIsBetter}
                  />
                </div>
              ))}
            </div>
          </MetricCard>
        );
      })}
    </div>
  );
}
