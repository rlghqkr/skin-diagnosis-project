import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Camera, ShoppingBag, ChevronRight, ChevronLeft } from "lucide-react";
import clsx from "clsx";

const ONBOARDING_KEY = "nia-onboarding-done";

const SLIDES = [
  {
    icon: Sparkles,
    title: "AI 피부 분석",
    description: "딥러닝 기반 AI가 당신의 피부를 정밀하게 분석합니다.\n5개 항목, 9개 부위를 한 번에 측정하세요.",
  },
  {
    icon: Camera,
    title: "간편한 촬영",
    description: "카메라로 셀피를 촬영하거나\n갤러리에서 사진을 선택하세요.\n정면 얼굴 사진 한 장이면 충분합니다.",
  },
  {
    icon: ShoppingBag,
    title: "맞춤 화장품 추천",
    description: "분석 결과를 바탕으로\n당신의 피부에 맞는 화장품을\n추천해드립니다.",
  },
] as const;

export function isOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingDone(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // ignore storage errors
  }
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLast = currentSlide === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      markOnboardingDone();
      navigate("/", { replace: true });
    } else {
      setCurrentSlide((s) => s + 1);
    }
  }, [isLast, navigate]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((s) => s - 1);
    }
  }, [currentSlide]);

  const handleSkip = useCallback(() => {
    markOnboardingDone();
    navigate("/", { replace: true });
  }, [navigate]);

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      {/* Skip button */}
      <div className="flex justify-end px-5 py-4">
        <button
          type="button"
          onClick={handleSkip}
          className="min-h-[44px] px-3 flex items-center text-sm text-[#8B95A1] transition-colors active:text-[#4E5968]"
        >
          건너뛰기
        </button>
      </div>

      {/* Slide content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div key={currentSlide} className="animate-float-in flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#EBF1FF]">
            <Icon size={36} className="text-[#5B8CFF]" />
          </div>

          {/* Title */}
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-[#191F28]">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="max-w-xs whitespace-pre-line text-sm leading-relaxed text-[#8B95A1]">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-6 pb-12">
        {/* Dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={clsx(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentSlide
                  ? "w-6 bg-[#5B8CFF]"
                  : "w-1.5 bg-[#E5E8EB]",
              )}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          {currentSlide > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[#8B95A1] active:brightness-95 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#5B8CFF] text-base font-semibold text-white shadow-[0_4px_16px_rgba(91,140,255,0.3)] active:brightness-95 transition-all"
          >
            {isLast ? (
              <>
                시작하기
                <Sparkles size={16} />
              </>
            ) : (
              <>
                다음
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
