import { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
}

const PHOTOS = [
  { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face", tx: -140, ty: -260, r: -18 },
  { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face", tx: 20, ty: -300, r: 10 },
  { src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face", tx: 160, ty: -240, r: 22 },
  { src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face", tx: -200, ty: 10, r: -12 },
  { src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face", tx: 0, ty: -40, r: 5 },
  { src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face", tx: 200, ty: 30, r: 16 },
  { src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face", tx: -150, ty: 260, r: 20 },
  { src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face", tx: 30, ty: 300, r: -8 },
  { src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop&crop=face", tx: 170, ty: 250, r: -20 },
];

type Phase = "scatter" | "gather" | "text" | "exit";

export default function Preloader({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("scatter");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("gather"), 50),
      setTimeout(() => setPhase("text"), 1400),
      setTimeout(() => setPhase("exit"), 2800),
      setTimeout(onComplete, 3300),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const scattered = phase === "scatter";

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        phase === "exit" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {PHOTOS.map((photo, i) => (
          <div
            key={i}
            className="preloader-photo h-[88px] w-[88px] overflow-hidden rounded-2xl shadow-md sm:h-[104px] sm:w-[104px]"
            style={{
              transitionDelay: `${i * 50}ms`,
              transform: scattered
                ? `translate(${photo.tx}px, ${photo.ty}px) rotate(${photo.r}deg) scale(0.4)`
                : "translate(0, 0) rotate(0deg) scale(1)",
              opacity: scattered ? 0 : 1,
            }}
          >
            <img
              src={photo.src}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
        ))}
      </div>

      {/* Brand text */}
      {(phase === "text" || phase === "exit") && (
        <>
          <h1
            className="mt-8 font-brand text-4xl text-[#191F28] sm:text-5xl"
            style={{
              animation:
                "preloader-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            SkinNerd AI
          </h1>
          <p
            className="mt-3 text-sm font-medium tracking-[0.1em] text-[#8B95A1]"
            style={{
              animation:
                "preloader-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards",
              opacity: 0,
            }}
          >
            AI 피부 분석
          </p>
        </>
      )}
    </div>
  );
}
