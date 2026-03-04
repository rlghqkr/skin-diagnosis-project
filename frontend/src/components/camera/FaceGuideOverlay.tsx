export default function FaceGuideOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {/* Darkened edges */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Clear oval cutout in center */}
      <div
        className="relative z-10"
        style={{
          width: "65%",
          aspectRatio: "3/4",
        }}
      >
        <div
          className="absolute inset-0 rounded-[50%] border-2 border-white/30"
          style={{
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
          }}
        />

        {/* Corner guides — Toss blue */}
        <div className="absolute -left-1 -top-1 h-6 w-6 border-l-2 border-t-2 border-[#3182F6] rounded-tl-xl" />
        <div className="absolute -right-1 -top-1 h-6 w-6 border-r-2 border-t-2 border-[#3182F6] rounded-tr-xl" />
        <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b-2 border-l-2 border-[#3182F6] rounded-bl-xl" />
        <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b-2 border-r-2 border-[#3182F6] rounded-br-xl" />
      </div>

      {/* Guide text */}
      <div className="absolute bottom-8 left-0 right-0 z-10 text-center">
        <p className="text-sm font-medium text-white/80">
          얼굴을 가이드 안에 맞춰주세요
        </p>
        <p className="mt-1 text-xs text-white/40">
          정면을 바라보고 자연광에서 촬영하세요
        </p>
      </div>
    </div>
  );
}
