import { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: Props) {
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("exit"), 800);
    const t2 = setTimeout(onComplete, 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-950 transition-opacity duration-400 ${
        phase === "exit" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Brand name */}
      <h1
        className="font-brand text-4xl text-cream-200 sm:text-5xl"
        style={{
          animation: "preloader-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        Namju
      </h1>

      {/* Tagline */}
      <p
        className="mt-4 text-sm font-light tracking-[0.15em] text-white/30"
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
