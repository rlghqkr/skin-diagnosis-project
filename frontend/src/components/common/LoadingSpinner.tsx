export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-5">
        {/* Simple spinner */}
        <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-rose-400 animate-spin" />

        {/* Text */}
        <div className="text-center">
          <p className="text-sm font-medium tracking-wide text-cream-200/70">
            피부를 분석하고 있습니다
          </p>
          <p className="mt-1 text-xs font-light text-white/30">
            잠시만 기다려 주세요
          </p>
        </div>
      </div>
    </div>
  );
}
