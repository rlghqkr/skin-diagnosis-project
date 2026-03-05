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

        {/* SVG 3D wireframe face + landmark guides */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 200 266"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* ── 3D WIREFRAME FACE MESH ── */}
          <g stroke="white" strokeOpacity="0.18" strokeWidth="0.6" fill="none">
            {/* Face outline */}
            <path d="M100,12 C60,12 35,45 28,80 C22,110 18,130 20,150 C22,170 30,190 45,208 C60,226 80,238 100,242 C120,238 140,226 155,208 C170,190 178,170 180,150 C182,130 178,110 172,80 C165,45 140,12 100,12Z" />

            {/* Horizontal contour lines — forehead */}
            <path d="M52,32 C65,26 80,23 100,22 C120,23 135,26 148,32" />
            <path d="M42,48 C60,38 78,34 100,33 C122,34 140,38 158,48" />
            <path d="M35,65 C55,52 76,47 100,46 C124,47 145,52 165,65" />
            <path d="M30,82 C52,68 75,62 100,61 C125,62 148,68 170,82" />

            {/* Horizontal contour — eye level */}
            <path d="M25,100 C50,90 74,86 100,85 C126,86 150,90 175,100" />

            {/* Horizontal contour — below eyes / cheeks */}
            <path d="M24,118 C48,107 73,102 100,101 C127,102 152,107 176,118" />
            <path d="M26,136 C50,124 74,119 100,118 C126,119 150,124 174,136" />

            {/* Horizontal contour — nose / mouth area */}
            <path d="M32,154 C54,142 76,137 100,136 C124,137 146,142 168,154" />
            <path d="M40,170 C58,160 78,155 100,154 C122,155 142,160 160,170" />
            <path d="M48,186 C64,177 80,173 100,172 C120,173 136,177 152,186" />

            {/* Horizontal contour — chin */}
            <path d="M58,200 C72,193 85,190 100,189 C115,190 128,193 142,200" />
            <path d="M70,214 C80,208 90,205 100,204 C110,205 120,208 130,214" />
            <path d="M82,228 C88,224 94,222 100,221 C106,222 112,224 118,228" />

            {/* Vertical contour lines — following face shape */}
            <path d="M100,22 L100,242" />
            <path d="M80,24 C78,60 76,100 78,140 C80,180 85,220 92,240" />
            <path d="M120,24 C122,60 124,100 122,140 C120,180 115,220 108,240" />
            <path d="M62,36 C56,65 52,100 54,140 C56,175 62,205 78,230" />
            <path d="M138,36 C144,65 148,100 146,140 C144,175 138,205 122,230" />
            <path d="M45,55 C38,80 34,110 35,145 C37,175 48,200 62,218" />
            <path d="M155,55 C162,80 166,110 165,145 C163,175 152,200 138,218" />

            {/* ── Eye sockets ── */}
            {/* Left eye */}
            <ellipse cx="68" cy="98" rx="18" ry="10" />
            <ellipse cx="68" cy="98" rx="13" ry="7" />
            {/* Right eye */}
            <ellipse cx="132" cy="98" rx="18" ry="10" />
            <ellipse cx="132" cy="98" rx="13" ry="7" />

            {/* Eyebrow ridges */}
            <path d="M46,84 C52,78 60,76 70,77 C78,78 84,80 88,84" />
            <path d="M112,84 C116,80 122,78 132,77 C140,76 148,78 154,84" />

            {/* ── Nose ── */}
            <path d="M96,86 C94,100 92,115 90,130 C88,138 85,144 82,148" />
            <path d="M104,86 C106,100 108,115 110,130 C112,138 115,144 118,148" />
            {/* Nose bridge lines */}
            <path d="M92,100 L92,135" />
            <path d="M108,100 L108,135" />
            {/* Nostrils */}
            <path d="M82,148 C86,152 92,154 100,154 C108,154 114,152 118,148" />
            <path d="M86,148 C90,145 96,144 100,144 C104,144 110,145 114,148" />
            {/* Nose tip contour */}
            <path d="M88,140 C92,143 96,144 100,144 C104,144 108,143 112,140" />

            {/* ── Mouth ── */}
            <path d="M76,170 C82,165 90,163 100,163 C110,163 118,165 124,170" />
            <path d="M78,170 C86,175 92,177 100,177 C108,177 114,175 122,170" />
            {/* Inner lips */}
            <path d="M82,170 C88,167 94,166 100,166 C106,166 112,167 118,170" />
            <path d="M84,170 C90,173 95,174 100,174 C105,174 110,173 116,170" />

            {/* ── Ears (wireframe) ── */}
            {/* Left ear */}
            <path d="M22,90 C14,92 10,100 10,112 C10,124 14,132 20,136 C22,130 22,120 22,110" />
            <path d="M22,95 C17,97 14,104 14,112 C14,120 16,128 20,132" />
            {/* Right ear */}
            <path d="M178,90 C186,92 190,100 190,112 C190,124 186,132 180,136 C178,130 178,120 178,110" />
            <path d="M178,95 C183,97 186,104 186,112 C186,120 184,128 180,132" />

            {/* ── Jaw mesh detail ── */}
            <path d="M35,160 C40,172 48,184 58,196" />
            <path d="M165,160 C160,172 152,184 142,196" />
            <path d="M42,175 C50,188 60,200 72,210" />
            <path d="M158,175 C150,188 140,200 128,210" />
          </g>

          {/* ── ANALYSIS GUIDE LINES ── */}

          {/* V-line: ears to chin (Vi) */}
          <line x1="18" y1="115" x2="100" y2="236" stroke="#FF6B5A" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="182" y1="115" x2="100" y2="236" stroke="#FF6B5A" strokeOpacity="0.5" strokeWidth="1" />

          {/* Jaw V-line (Va) */}
          <line x1="30" y1="175" x2="100" y2="252" stroke="#FF6B5A" strokeOpacity="0.35" strokeWidth="0.8" />
          <line x1="170" y1="175" x2="100" y2="252" stroke="#FF6B5A" strokeOpacity="0.35" strokeWidth="0.8" />

          {/* Landmark dots — eyes outer corners */}
          <circle cx="48" cy="98" r="3" fill="#FF6B5A" fillOpacity="0.85" />
          <circle cx="152" cy="98" r="3" fill="#FF6B5A" fillOpacity="0.85" />

          {/* Landmark dots — ear points */}
          <circle cx="18" cy="115" r="3.5" fill="#FF6B5A" fillOpacity="0.85" />
          <circle cx="182" cy="115" r="3.5" fill="#FF6B5A" fillOpacity="0.85" />

          {/* Landmark dots — jaw points */}
          <circle cx="30" cy="175" r="3" fill="#FF6B5A" fillOpacity="0.85" />
          <circle cx="170" cy="175" r="3" fill="#FF6B5A" fillOpacity="0.85" />

          {/* Landmark dot — chin */}
          <circle cx="100" cy="236" r="3.5" fill="#FF6B5A" fillOpacity="0.85" />
          <circle cx="100" cy="252" r="3" fill="#FF6B5A" fillOpacity="0.65" />

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
