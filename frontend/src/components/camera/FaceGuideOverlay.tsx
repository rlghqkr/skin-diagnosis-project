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

        {/* SVG face landmark guides */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 200 260"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Horizontal grid lines */}
          <line x1="30" y1="80" x2="170" y2="80" stroke="white" strokeOpacity="0.15" strokeWidth="0.8" />
          <line x1="25" y1="110" x2="175" y2="110" stroke="white" strokeOpacity="0.15" strokeWidth="0.8" />
          <line x1="30" y1="145" x2="170" y2="145" stroke="white" strokeOpacity="0.15" strokeWidth="0.8" />
          <line x1="45" y1="175" x2="155" y2="175" stroke="white" strokeOpacity="0.15" strokeWidth="0.8" />

          {/* Vertical center line */}
          <line x1="100" y1="30" x2="100" y2="230" stroke="white" strokeOpacity="0.15" strokeWidth="0.8" />

          {/* Eye level guide lines */}
          <line x1="45" y1="100" x2="82" y2="100" stroke="rgba(91,140,255,0.5)" strokeWidth="1" />
          <line x1="118" y1="100" x2="155" y2="100" stroke="rgba(91,140,255,0.5)" strokeWidth="1" />

          {/* Nose bridge vertical */}
          <line x1="100" y1="90" x2="100" y2="155" stroke="rgba(91,140,255,0.3)" strokeWidth="0.8" strokeDasharray="4 3" />

          {/* V-line: ears to chin (Vi) */}
          <line x1="18" y1="115" x2="100" y2="230" stroke="#FF6B5A" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="182" y1="115" x2="100" y2="230" stroke="#FF6B5A" strokeOpacity="0.5" strokeWidth="1" />

          {/* Jaw line (Va) */}
          <line x1="30" y1="175" x2="100" y2="245" stroke="#FF6B5A" strokeOpacity="0.35" strokeWidth="0.8" />
          <line x1="170" y1="175" x2="100" y2="245" stroke="#FF6B5A" strokeOpacity="0.35" strokeWidth="0.8" />

          {/* Landmark dots — eyes outer corners */}
          <circle cx="45" cy="100" r="3" fill="#FF6B5A" fillOpacity="0.8" />
          <circle cx="155" cy="100" r="3" fill="#FF6B5A" fillOpacity="0.8" />

          {/* Landmark dots — eyes inner corners */}
          <circle cx="82" cy="100" r="2.5" fill="#FF6B5A" fillOpacity="0.6" />
          <circle cx="118" cy="100" r="2.5" fill="#FF6B5A" fillOpacity="0.6" />

          {/* Landmark dots — ear points */}
          <circle cx="18" cy="115" r="3" fill="#FF6B5A" fillOpacity="0.8" />
          <circle cx="182" cy="115" r="3" fill="#FF6B5A" fillOpacity="0.8" />

          {/* Landmark dots — jaw points */}
          <circle cx="30" cy="175" r="3" fill="#FF6B5A" fillOpacity="0.8" />
          <circle cx="170" cy="175" r="3" fill="#FF6B5A" fillOpacity="0.8" />

          {/* Landmark dot — chin */}
          <circle cx="100" cy="230" r="3.5" fill="#FF6B5A" fillOpacity="0.8" />

          {/* Landmark dot — chin bottom (Va) */}
          <circle cx="100" cy="245" r="3" fill="#FF6B5A" fillOpacity="0.6" />

          {/* Labels */}
          <text x="112" y="233" fill="white" fillOpacity="0.6" fontSize="10" fontFamily="Pretendard Variable, sans-serif">Vi</text>
          <text x="112" y="250" fill="white" fillOpacity="0.5" fontSize="10" fontFamily="Pretendard Variable, sans-serif">Va</text>
        </svg>

        {/* Corner guides */}
        <div className="absolute -left-1 -top-1 h-6 w-6 border-l-2 border-t-2 border-[#5B8CFF] rounded-tl-xl" />
        <div className="absolute -right-1 -top-1 h-6 w-6 border-r-2 border-t-2 border-[#5B8CFF] rounded-tr-xl" />
        <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b-2 border-l-2 border-[#5B8CFF] rounded-bl-xl" />
        <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b-2 border-r-2 border-[#5B8CFF] rounded-br-xl" />
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
