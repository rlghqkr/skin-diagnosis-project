import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Camera, Sparkles, ChevronRight } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (file && file.type.startsWith("image/")) {
        navigate("/analysis", { state: { file } });
      }
    },
    [navigate],
  );

  return (
    <div className="flex min-h-[calc(100dvh-120px)] flex-col">
      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="animate-float-in w-full max-w-md text-center">
          {/* Logo accent */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <Sparkles size={28} className="text-rose-400" />
          </div>

          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-cream-200 sm:text-3xl">
            AI 피부 분석
          </h2>
          <p className="mx-auto mb-2 max-w-xs text-sm leading-relaxed text-white/40">
            사진 한 장으로 피부 상태를 정밀하게 분석하고
            <br />
            맞춤 화장품을 추천받으세요
          </p>
          <p className="mx-auto mb-10 text-xs text-white/25">
            5개 항목 분석 · 9개 부위 측정 · 무료
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {/* Camera button */}
            <button
              type="button"
              onClick={() => navigate("/camera")}
              className="btn-primary group flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-medium tracking-wide text-white shadow-lg shadow-rose-500/15"
            >
              <Camera size={20} />
              카메라로 촬영하기
            </button>

            {/* Upload button */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="card card-hover group flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-medium tracking-wide text-white/50 transition-all hover:text-white/70"
            >
              <ImagePlus size={18} className="text-white/30 group-hover:text-rose-400/60 transition-colors" />
              갤러리에서 사진 선택
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "피부 등급", desc: "5단계 진단" },
            { label: "부위별 분석", desc: "9개 영역" },
            { label: "맞춤 추천", desc: "화장품 제안" },
          ].map((item) => (
            <div
              key={item.label}
              className="card flex flex-col items-center gap-1.5 rounded-xl px-3 py-4 text-center"
            >
              <span className="text-xs font-medium text-cream-200/80">{item.label}</span>
              <span className="text-[10px] text-white/30">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="px-4 pb-8">
        <h3 className="mb-4 text-sm font-medium text-white/50">이용 방법</h3>
        <div className="space-y-3">
          {[
            { step: "1", title: "사진 촬영", desc: "정면 얼굴 사진을 촬영하거나 업로드하세요" },
            { step: "2", title: "AI 분석", desc: "딥러닝 모델이 피부 상태를 정밀 분석합니다" },
            { step: "3", title: "결과 확인", desc: "분석 결과와 맞춤 화장품 추천을 확인하세요" },
          ].map((item) => (
            <div
              key={item.step}
              className="card card-hover flex items-center gap-4 rounded-xl px-4 py-3.5"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-sm font-semibold text-rose-400">
                {item.step}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-cream-200/80">{item.title}</p>
                <p className="text-xs text-white/30">{item.desc}</p>
              </div>
              <ChevronRight size={14} className="text-white/15" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
