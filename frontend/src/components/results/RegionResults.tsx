import { useEffect, useRef } from "react";
import type { PredictResponse, ClassificationResult, RegressionResult } from "../../types/api";
import {
  FACEPART_LABELS,
  CLASS_METRICS,
  REGRESSION_METRICS,
} from "../../constants/skinMetrics";
import GradeBadge from "./GradeBadge";
import GradeBar from "./GradeBar";
import ValueGauge from "./ValueGauge";

interface Props {
  result: PredictResponse;
  selectedRegion: string | null;
}

export default function RegionResults({ result, selectedRegion }: Props) {
  const regions = new Set<string>();
  for (const regionMap of Object.values(result.predictions)) {
    for (const region of Object.keys(regionMap as Record<string, unknown>)) {
      regions.add(region);
    }
  }

  const regionList = Array.from(regions);
  const selectedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedRegion && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedRegion]);

  return (
    <div className="flex flex-col gap-3">
      {regionList.map((region) => {
        const isSelected = selectedRegion === region;
        return (
          <div
            key={region}
            ref={isSelected ? selectedRef : undefined}
            className={`card rounded-xl p-4 transition-all duration-300 ${
              isSelected
                ? "!border-rose-400/25 !bg-rose-400/[0.04] ring-1 ring-rose-400/10"
                : "card-hover"
            }`}
          >
            <h3 className="mb-4 text-center text-sm font-medium tracking-wide text-cream-200/80">
              <span
                className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ backgroundColor: isSelected ? "#e89ab5" : "rgba(255,255,255,0.15)" }}
              />
              {FACEPART_LABELS[region] ?? region}
            </h3>
            <div className="space-y-3">
              {result.mode === "class"
                ? renderClassMetrics(
                    result.predictions as Record<string, Record<string, ClassificationResult>>,
                    region,
                  )
                : renderRegMetrics(
                    result.predictions as Record<string, Record<string, RegressionResult>>,
                    region,
                  )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderClassMetrics(
  predictions: Record<string, Record<string, ClassificationResult>>,
  region: string,
) {
  return Object.entries(predictions).map(([metricKey, regionMap]) => {
    const meta = CLASS_METRICS[metricKey];
    const result = regionMap[region];
    if (!result) return null;
    return (
      <div key={metricKey}>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-light text-white/35">{meta?.label ?? metricKey}</span>
          <GradeBadge grade={result.grade} />
        </div>
        <GradeBar probabilities={result.probabilities} />
      </div>
    );
  });
}

function renderRegMetrics(
  predictions: Record<string, Record<string, RegressionResult>>,
  region: string,
) {
  return Object.entries(predictions).map(([metricKey, regionMap]) => {
    const meta = REGRESSION_METRICS[metricKey];
    const result = regionMap[region];
    if (!meta || !result) return null;
    return (
      <div key={metricKey}>
        <span className="text-xs font-light text-white/35">{meta.label}</span>
        <ValueGauge
          value={result.value}
          min={meta.min}
          max={meta.max}
          unit={meta.unit}
          higherIsBetter={meta.higherIsBetter}
        />
      </div>
    );
  });
}
