export default function Footer() {
  return (
    <footer className="safe-bottom relative z-10 border-t border-white/[0.03] py-4">
      <div className="flex flex-col items-center gap-2 px-4">
        <p className="font-brand text-xs text-white/20">
          남주 — AI 피부 분석
        </p>
        <p className="text-[10px] tracking-wide text-white/10">
          결과는 참고용이며 전문의 상담을 권장합니다
        </p>
        <p className="text-[10px] text-white/[0.06]">
          &copy; 2025 Namju. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
