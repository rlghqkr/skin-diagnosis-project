import { useEffect, useState } from "react";

const STEPS = [
  { label: "얼굴 영역 감지 중", duration: 1500 },
  { label: "피부 상태 분석 중", duration: 2000 },
  { label: "부위별 측정 중", duration: 1500 },
  { label: "결과 생성 중", duration: 1000 },
] as const;

interface Props {
  imageUrl?: string | null;
}

export default function AnalysisLoading({ imageUrl }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = STEPS.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 50;
      const pct = Math.min((elapsed / totalDuration) * 100, 95);
      setProgress(pct);

      // Determine current step
      let accumulated = 0;
      for (let i = 0; i < STEPS.length; i++) {
        accumulated += STEPS[i].duration;
        if (elapsed < accumulated) {
          setCurrentStep(i);
          break;
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/90 backdrop-blur-xl">
      <div className="flex w-full max-w-sm flex-col items-center px-8">
        {/* Face scan animation */}
        <div className="relative mb-8">
          {imageUrl ? (
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-rose-400/30">
              <img
                src={imageUrl}
                alt="분석 중"
                className="h-full w-full object-cover"
              />
              {/* Scan line */}
              <div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent"
                style={{
                  animation: "scan-line 2s ease-in-out infinite",
                }}
              />
            </div>
          ) : (
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-rose-400/30 bg-dark-800">
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-full border-2 border-rose-400/20 animate-ping" />
              <div className="h-16 w-16 rounded-full border border-rose-400/20 bg-rose-400/5" />
              {/* Scan line */}
              <div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent"
                style={{
                  animation: "scan-line 2s ease-in-out infinite",
                }}
              />
            </div>
          )}
        </div>

        {/* Current step text */}
        <p className="mb-6 text-sm font-medium tracking-wide text-cream-200/80">
          {STEPS[currentStep]?.label ?? "분석 완료 중"}
        </p>

        {/* Progress bar */}
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress percentage */}
        <p className="text-xs text-white/30">
          {Math.round(progress)}%
        </p>

        {/* Step indicators */}
        <div className="mt-6 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-6 rounded-full transition-all duration-500 ${
                i <= currentStep ? "bg-rose-400/60" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
