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
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
  },
  {
    icon: Camera,
    title: "간편한 촬영",
    description: "카메라로 셀피를 촬영하거나\n갤러리에서 사진을 선택하세요.\n정면 얼굴 사진 한 장이면 충분합니다.",
    color: "text-gold-400",
    bgColor: "bg-gold-400/10",
    borderColor: "border-gold-400/20",
  },
  {
    icon: ShoppingBag,
    title: "맞춤 화장품 추천",
    description: "분석 결과를 바탕으로\n당신의 피부에 맞는 화장품을\n추천해드립니다.",
    color: "text-cream-200",
    bgColor: "bg-cream-200/10",
    borderColor: "border-cream-200/20",
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
    <div className="flex min-h-[100dvh] flex-col bg-dark-950">
      {/* Skip button */}
      <div className="flex justify-end px-4 py-4">
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs font-light tracking-wide text-white/30 transition-colors hover:text-white/50 min-h-[44px] px-3 flex items-center"
        >
          건너뛰기
        </button>
      </div>

      {/* Slide content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div key={currentSlide} className="animate-float-in flex flex-col items-center text-center">
          {/* Icon */}
          <div className={clsx(
            "mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border",
            slide.bgColor,
            slide.borderColor,
          )}>
            <Icon size={36} className={slide.color} />
          </div>

          {/* Title */}
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-cream-200">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="max-w-xs whitespace-pre-line text-sm leading-relaxed text-white/40">
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
                  ? "w-6 bg-rose-400"
                  : "w-1.5 bg-white/15",
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
              className="card flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-white/40"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary flex h-14 flex-1 items-center justify-center gap-2 rounded-xl text-base font-medium text-white shadow-lg shadow-rose-500/15"
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
