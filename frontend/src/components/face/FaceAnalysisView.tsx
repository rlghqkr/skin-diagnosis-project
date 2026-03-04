import { useState } from "react";
import type { PredictResponse, ClassificationResult, RegressionResult } from "../../types/api";
import {
  FACE_REGION_POSITIONS,
  FACEPART_LABELS,
  CLASS_METRICS,
  REGRESSION_METRICS,
  getGradeDescription,
  getValueStatus,
} from "../../constants/skinMetrics";
import { gradeColor } from "../../utils/gradeColor";
import { formatValue } from "../../utils/formatValue";

interface Props {
  previewUrl: string;
  result: PredictResponse | null;
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
}

function getMetricDots(
  result: PredictResponse,
  region: string,
): { label: string; color: string }[] {
  const dots: { label: string; color: string }[] = [];
  const preds = result.predictions;

  for (const [metric, regionMap] of Object.entries(preds)) {
    const val = (regionMap as Record<string, ClassificationResult | RegressionResult>)[region];
    if (!val) continue;

    if (result.mode === "class") {
      const meta = CLASS_METRICS[metric];
      const cr = val as ClassificationResult;
      dots.push({ label: meta?.label ?? metric, color: gradeColor(cr.grade) });
    } else {
      const meta = REGRESSION_METRICS[metric];
      if (!meta) continue;
      const rr = val as RegressionResult;
      const clamped = Math.max(meta.min, Math.min(rr.value, meta.max));
      const ratio = meta.max > meta.min ? (clamped - meta.min) / (meta.max - meta.min) : 0;
      const status = getValueStatus(ratio, meta.higherIsBetter);
      dots.push({ label: meta.label, color: status.color });
    }
  }
  return dots;
}

function getSummary(result: PredictResponse, region: string): string[] {
  const lines: string[] = [];
  const preds = result.predictions;

  for (const [metric, regionMap] of Object.entries(preds)) {
    const val = (regionMap as Record<string, ClassificationResult | RegressionResult>)[region];
    if (!val) continue;

    if (result.mode === "class") {
      const meta = CLASS_METRICS[metric];
      const cr = val as ClassificationResult;
      lines.push(`${meta?.label ?? metric}: ${cr.grade}등급 · ${getGradeDescription(cr.grade)}`);
    } else {
      const meta = REGRESSION_METRICS[metric];
      if (!meta) continue;
      const rr = val as RegressionResult;
      const clamped = Math.max(meta.min, Math.min(rr.value, meta.max));
      const ratio = meta.max > meta.min ? (clamped - meta.min) / (meta.max - meta.min) : 0;
      const status = getValueStatus(ratio, meta.higherIsBetter);
      lines.push(`${meta.label}: ${formatValue(rr.value)}${meta.unit} · ${status.label}`);
    }
  }
  return lines;
}

function getRegionColor(result: PredictResponse, region: string): string {
  if (result.mode === "class") {
    const firstMetric = Object.values(result.predictions)[0];
    const val = firstMetric?.[region] as ClassificationResult | undefined;
    if (val) return gradeColor(val.grade);
  }
  return "#5B8CFF";
}

export default function FaceAnalysisView({ previewUrl, result, selectedRegion, onSelectRegion }: Props) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const handleRegionClick = (region: string) => {
    onSelectRegion(selectedRegion === region ? null : region);
  };

  return (
    <div className="flex justify-center">
      <div className="relative w-full">
          {/* Image with frame */}
          <div className="overflow-hidden rounded-2xl border border-[#E5E8EB] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <img
              src={previewUrl}
              alt="얼굴 분석"
              className="w-full object-contain"
            />
          </div>

          {/* Region overlays */}
          {Object.entries(FACE_REGION_POSITIONS).map(([region, pos]) => {
            const isHovered = hoveredRegion === region;
            const isSelected = selectedRegion === region;
            const isActive = isHovered || isSelected;
            const hasResult = result !== null;
            const color = hasResult ? getRegionColor(result, region) : "#5B8CFF";
            const summary = hasResult ? getSummary(result, region) : [];
            const dots = hasResult ? getMetricDots(result, region) : [];

            return (
              <div key={region}>
                <div
                  className="absolute cursor-pointer transition-all duration-300 ease-out"
                  style={{
                    top: `${pos.top}%`,
                    left: `${pos.left}%`,
                    width: `${pos.width}%`,
                    height: `${pos.height}%`,
                    backgroundColor: isActive ? `${color}25` : `${color}10`,
                    border: `1px solid ${isActive ? `${color}80` : `${color}30`}`,
                    borderRadius: "8px",
                    boxShadow: isSelected
                      ? `0 0 20px ${color}30, inset 0 0 20px ${color}10`
                      : "none",
                  }}
                  onMouseEnter={() => setHoveredRegion(region)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => handleRegionClick(region)}
                />

                {/* Floating label — hidden on mobile */}
                <div
                  className="pointer-events-none absolute transition-all duration-300 ease-out hidden sm:block"
                  style={{
                    top: `${pos.top + pos.height / 2}%`,
                    ...(pos.labelSide === "left"
                      ? { right: `${100 - pos.left + 3}%` }
                      : { left: `${pos.left + pos.width + 3}%` }),
                    transform: "translateY(-50%)",
                    opacity: isActive || !hasResult ? 1 : 0.5,
                  }}
                >
                  <div
                    className="whitespace-nowrap rounded-xl px-3.5 py-2 text-xs transition-all duration-300"
                    style={{
                      backgroundColor: isActive
                        ? "rgba(255, 255, 255, 0.98)"
                        : "rgba(255, 255, 255, 0.9)",
                      border: `1px solid ${isActive ? `${color}50` : "#E5E8EB"}`,
                      boxShadow: isActive
                        ? `0 4px 20px rgba(0,0,0,0.1), 0 0 15px ${color}15`
                        : "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold"
                        style={{ color: isActive ? color : "#191F28" }}
                      >
                        {FACEPART_LABELS[region] ?? region}
                      </span>
                      {hasResult && dots.length > 0 && (
                        <div className="flex gap-1">
                          {dots.map((dot, i) => (
                            <div
                              key={i}
                              className="h-1.5 w-1.5 rounded-full transition-all"
                              style={{
                                backgroundColor: dot.color,
                                boxShadow: isActive ? `0 0 4px ${dot.color}60` : "none",
                              }}
                              title={dot.label}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {hasResult && isActive && summary.length > 0 && (
                      <div className="mt-1.5 space-y-0.5 border-t border-[#E5E8EB] pt-1.5">
                        {summary.map((line, i) => (
                          <div key={i} className="text-[11px] text-[#4E5968]">
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Connection line */}
                  <div
                    className="absolute top-1/2 h-px w-4 transition-colors duration-300"
                    style={{
                      backgroundColor: isActive ? `${color}60` : "#E5E8EB",
                      ...(pos.labelSide === "left"
                        ? { right: "-16px" }
                        : { left: "-16px" }),
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Mobile region info panel — below image */}
          <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
            {Object.entries(FACE_REGION_POSITIONS).map(([region]) => {
              const isSelected = selectedRegion === region;
              const hasResult = result !== null;
              const color = hasResult ? getRegionColor(result, region) : "#5B8CFF";
              const dots = hasResult ? getMetricDots(result, region) : [];

              return (
                <button
                  key={region}
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all"
                  style={{
                    backgroundColor: isSelected ? `${color}15` : "#F2F4F6",
                    border: `1px solid ${isSelected ? `${color}50` : "#E5E8EB"}`,
                  }}
                  onClick={() => handleRegionClick(region)}
                >
                  <span style={{ color: isSelected ? color : "#191F28" }} className="font-medium">
                    {FACEPART_LABELS[region] ?? region}
                  </span>
                  {hasResult && dots.length > 0 && (
                    <div className="flex gap-0.5">
                      {dots.map((dot, i) => (
                        <div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: dot.color }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {/* Mobile selected region detail */}
          {selectedRegion && result && (
            <div className="mt-2 rounded-xl border border-[#E5E8EB] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] sm:hidden">
              {getSummary(result, selectedRegion).map((line, i) => (
                <div key={i} className="text-[11px] text-[#4E5968]">
                  {line}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
