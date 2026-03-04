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
    <div className="flex min-h-[calc(100dvh-120px)] flex-col bg-white">
      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-md text-center">
          {/* Logo accent */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F3FF]">
            <Sparkles size={28} className="text-[#3182F6]" />
          </div>

          <h2 className="mb-3 text-2xl font-bold tracking-tight text-[#191F28] sm:text-3xl">
            AI 피부 분석
          </h2>
          <p className="mx-auto mb-2 max-w-xs text-sm leading-relaxed text-[#8B95A1]">
            사진 한 장으로 피부 상태를 정밀하게 분석하고
            <br />
            맞춤 화장품을 추천받으세요
          </p>
          <p className="mx-auto mb-10 text-xs text-[#B0B8C1]">
            5개 항목 분석 · 9개 부위 측정 · 무료
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {/* Camera button */}
            <button
              type="button"
              onClick={() => navigate("/camera")}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#3182F6] px-6 py-4 text-base font-semibold text-white shadow-[0_4px_16px_rgba(49,130,246,0.3)] active:brightness-95 transition-all"
            >
              <Camera size={20} />
              카메라로 촬영하기
            </button>

            {/* Upload button */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#F2F4F6] px-6 py-4 text-sm font-medium text-[#4E5968] transition-all active:brightness-95"
            >
              <ImagePlus size={18} className="text-[#8B95A1]" />
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
      <div className="px-5 pb-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "피부 등급", desc: "5단계 진단" },
            { label: "부위별 분석", desc: "9개 영역" },
            { label: "맞춤 추천", desc: "화장품 제안" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#F2F4F6] px-3 py-4 text-center"
            >
              <span className="text-xs font-semibold text-[#191F28]">{item.label}</span>
              <span className="text-[10px] text-[#8B95A1]">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="px-5 pb-8">
        <h3 className="mb-4 text-sm font-bold text-[#191F28]">이용 방법</h3>
        <div className="space-y-3">
          {[
            { step: "1", title: "사진 촬영", desc: "정면 얼굴 사진을 촬영하거나 업로드하세요" },
            { step: "2", title: "AI 분석", desc: "딥러닝 모델이 피부 상태를 정밀 분석합니다" },
            { step: "3", title: "결과 확인", desc: "분석 결과와 맞춤 화장품 추천을 확인하세요" },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#3182F6] text-sm font-bold text-white">
                {item.step}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#191F28]">{item.title}</p>
                <p className="text-xs text-[#8B95A1]">{item.desc}</p>
              </div>
              <ChevronRight size={14} className="text-[#D1D6DB]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
