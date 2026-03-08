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
          {/* ── 3D WIREFRAME FACE MESH (Feminine V-line) ── */}
          <g stroke="white" strokeOpacity="0.18" strokeWidth="0.6" fill="none">
            {/* Face outline — feminine V-line shape: narrower jaw, pointed chin */}
            <path d="M100,14 C62,14 38,42 30,76 C24,104 21,124 22,144 C24,162 32,178 50,196 C66,210 84,228 100,238 C116,228 134,210 150,196 C168,178 176,162 178,144 C179,124 176,104 170,76 C162,42 138,14 100,14Z" />

            {/* Horizontal contour lines — forehead */}
            <path d="M54,32 C66,26 82,23 100,22 C118,23 134,26 146,32" />
            <path d="M44,48 C62,38 80,34 100,33 C120,34 138,38 156,48" />
            <path d="M36,64 C56,52 77,47 100,46 C123,47 144,52 164,64" />
            <path d="M31,80 C53,67 76,62 100,61 C124,62 147,67 169,80" />

            {/* Horizontal contour — eye level */}
            <path d="M26,98 C50,89 74,85 100,84 C126,85 150,89 174,98" />

            {/* Horizontal contour — below eyes / cheeks */}
            <path d="M24,116 C48,106 73,101 100,100 C127,101 152,106 176,116" />
            <path d="M26,134 C50,123 74,118 100,117 C126,118 150,123 174,134" />

            {/* Horizontal contour — nose / mouth area (narrower for feminine) */}
            <path d="M36,152 C56,141 77,136 100,135 C123,136 144,141 164,152" />
            <path d="M46,168 C62,159 80,154 100,153 C120,154 138,159 154,168" />
            <path d="M56,184 C68,176 83,172 100,171 C117,172 132,176 144,184" />

            {/* Horizontal contour — chin (narrower V-line) */}
            <path d="M66,198 C76,192 88,189 100,188 C112,189 124,192 134,198" />
            <path d="M76,212 C84,207 92,204 100,203 C108,204 116,207 124,212" />
            <path d="M86,226 C90,222 95,220 100,219 C105,220 110,222 114,226" />

            {/* Vertical contour lines — following feminine face shape */}
            <path d="M100,22 L100,238" />
            <path d="M82,24 C80,60 78,100 80,138 C82,174 88,214 96,236" />
            <path d="M118,24 C120,60 122,100 120,138 C118,174 112,214 104,236" />
            <path d="M64,36 C58,64 54,98 55,136 C57,168 66,200 82,224" />
            <path d="M136,36 C142,64 146,98 145,136 C143,168 134,200 118,224" />
            <path d="M46,54 C39,78 36,108 37,142 C38,168 50,194 66,214" />
            <path d="M154,54 C161,78 164,108 163,142 C162,168 150,194 134,214" />

            {/* ── Eye sockets (slightly larger, rounder for feminine) ── */}
            {/* Left eye */}
            <ellipse cx="68" cy="96" rx="19" ry="11" />
            <ellipse cx="68" cy="96" rx="14" ry="8" />
            {/* Right eye */}
            <ellipse cx="132" cy="96" rx="19" ry="11" />
            <ellipse cx="132" cy="96" rx="14" ry="8" />

            {/* Eyebrow ridges (higher arch for feminine) */}
            <path d="M46,82 C52,74 62,72 70,73 C78,74 84,77 88,82" />
            <path d="M112,82 C116,77 122,74 132,73 C140,72 148,74 154,82" />

            {/* ── Nose (slightly narrower for feminine) ── */}
            <path d="M96,84 C95,98 93,113 91,128 C89,136 87,142 85,146" />
            <path d="M104,84 C105,98 107,113 109,128 C111,136 113,142 115,146" />
            {/* Nose bridge lines */}
            <path d="M93,98 L93,133" />
            <path d="M107,98 L107,133" />
            {/* Nostrils */}
            <path d="M85,146 C89,150 94,152 100,152 C106,152 111,150 115,146" />
            <path d="M88,146 C92,143 96,142 100,142 C104,142 108,143 112,146" />
            {/* Nose tip contour */}
            <path d="M90,138 C94,141 97,142 100,142 C103,142 106,141 110,138" />

            {/* ── Mouth (slightly fuller lips for feminine) ── */}
            <path d="M78,168 C84,163 92,161 100,161 C108,161 116,163 122,168" />
            <path d="M80,168 C88,174 93,176 100,176 C107,176 112,174 120,168" />
            {/* Inner lips */}
            <path d="M84,168 C89,165 95,164 100,164 C105,164 111,165 116,168" />
            <path d="M85,168 C91,172 96,173 100,173 C104,173 109,172 115,168" />

            {/* ── Ears (slightly smaller for feminine) ── */}
            {/* Left ear */}
            <path d="M24,88 C17,90 13,98 13,108 C13,118 16,126 22,130 C23,124 24,116 24,106" />
            <path d="M24,92 C19,94 16,100 16,108 C16,116 18,122 22,126" />
            {/* Right ear */}
            <path d="M176,88 C183,90 187,98 187,108 C187,118 184,126 178,130 C177,124 176,116 176,106" />
            <path d="M176,92 C181,94 184,100 184,108 C184,116 182,122 178,126" />

            {/* ── Jaw mesh detail (softer, narrower for feminine V-line) ── */}
            <path d="M40,158 C46,170 54,182 66,194" />
            <path d="M160,158 C154,170 146,182 134,194" />
            <path d="M50,174 C58,186 68,198 78,208" />
            <path d="M150,174 C142,186 132,198 122,208" />
          </g>

          {/* ── ANALYSIS GUIDE LINES ── */}

          {/* V-line: ears to chin (Vi) */}
          <line x1="20" y1="112" x2="100" y2="234" stroke="#FF6B5A" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="180" y1="112" x2="100" y2="234" stroke="#FF6B5A" strokeOpacity="0.5" strokeWidth="1" />

          {/* Jaw V-line (Va) — narrower for feminine */}
          <line x1="38" y1="172" x2="100" y2="248" stroke="#FF6B5A" strokeOpacity="0.35" strokeWidth="0.8" />
          <line x1="162" y1="172" x2="100" y2="248" stroke="#FF6B5A" strokeOpacity="0.35" strokeWidth="0.8" />

          {/* Landmark dots — eyes outer corners */}
          <circle cx="48" cy="96" r="3" fill="#FF6B5A" fillOpacity="0.85" />
          <circle cx="152" cy="96" r="3" fill="#FF6B5A" fillOpacity="0.85" />

          {/* Landmark dots — ear points */}
          <circle cx="20" cy="112" r="3.5" fill="#FF6B5A" fillOpacity="0.85" />
          <circle cx="180" cy="112" r="3.5" fill="#FF6B5A" fillOpacity="0.85" />

          {/* Landmark dots — jaw points (narrower) */}
          <circle cx="38" cy="172" r="3" fill="#FF6B5A" fillOpacity="0.85" />
          <circle cx="162" cy="172" r="3" fill="#FF6B5A" fillOpacity="0.85" />

          {/* Landmark dot — chin */}
          <circle cx="100" cy="234" r="3.5" fill="#FF6B5A" fillOpacity="0.85" />
          <circle cx="100" cy="248" r="3" fill="#FF6B5A" fillOpacity="0.65" />

        </svg>

        {/* Corner guides */}
        <div className="absolute -left-1 -top-1 h-6 w-6 border-l-2 border-t-2 border-primary rounded-tl-xl" />
        <div className="absolute -right-1 -top-1 h-6 w-6 border-r-2 border-t-2 border-primary rounded-tr-xl" />
        <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b-2 border-l-2 border-primary rounded-bl-xl" />
        <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b-2 border-r-2 border-primary rounded-br-xl" />
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
