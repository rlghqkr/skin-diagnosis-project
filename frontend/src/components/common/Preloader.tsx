import { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: Props) {
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("exit"), 1500);
    const t2 = setTimeout(onComplete, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        phase === "exit" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* 3D Orb Scene */}
      <div className="relative h-64 w-64 sm:h-80 sm:w-80" style={{ perspective: "800px" }}>
        {/* Main gradient orb */}
        <div className="orb-main">
          <div className="orb-inner" />
        </div>

        {/* Floating orbit particles */}
        <div className="orbit-ring orbit-ring-1">
          <div className="orbit-particle orbit-particle-1" />
        </div>
        <div className="orbit-ring orbit-ring-2">
          <div className="orbit-particle orbit-particle-2" />
        </div>
        <div className="orbit-ring orbit-ring-3">
          <div className="orbit-particle orbit-particle-3" />
        </div>
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
