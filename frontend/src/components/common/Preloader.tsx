import { Suspense, useEffect, useState } from "react";
import { lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface Props {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: Props) {
  const [phase, setPhase] = useState<"enter" | "exit">("enter");
  const [splineLoaded, setSplineLoaded] = useState(false);

  useEffect(() => {
    // Wait for Spline to load, then show for a bit before transitioning out
    if (splineLoaded) {
      const t1 = setTimeout(() => setPhase("exit"), 2000);
      const t2 = setTimeout(onComplete, 2500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    // Fallback: if Spline takes too long, proceed anyway
    const fallback = setTimeout(() => {
      setPhase("exit");
      setTimeout(onComplete, 500);
    }, 6000);
    return () => clearTimeout(fallback);
  }, [splineLoaded, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        phase === "exit" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* 3D Spline Scene */}
      <div className="relative h-64 w-64 sm:h-80 sm:w-80">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-10 w-10 rounded-full border-2 border-[#E5E8EB] border-t-[#3182F6] animate-spin" />
            </div>
          }
        >
          <Spline
            scene="https://prod.spline.design/pkIqLkcy-rGNnCU2/scene.splinecode"
            onLoad={() => setSplineLoaded(true)}
          />
        </Suspense>
      </div>

      {/* Brand text */}
      <h1
        className="mt-4 font-brand text-4xl text-[#191F28] sm:text-5xl"
        style={{
          animation: "preloader-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        Namju
      </h1>

      <p
        className="mt-3 text-sm font-medium tracking-[0.1em] text-[#8B95A1]"
        style={{
          animation: "preloader-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards",
          opacity: 0,
        }}
      >
        AI 피부 분석
      </p>
    </div>
  );
}
