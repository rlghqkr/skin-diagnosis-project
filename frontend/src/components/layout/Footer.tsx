export default function Footer() {
  return (
    <footer className="safe-bottom relative z-10 border-t border-[#F2F4F6] py-4">
      <div className="flex flex-col items-center gap-2 px-5">
        <p className="text-xs font-semibold text-[#B0B8C1]">
          남주 — AI 피부 분석
        </p>
        <p className="text-[10px] tracking-wide text-[#D1D6DB]">
          결과는 참고용이며 전문의 상담을 권장합니다
        </p>
      </div>
    </footer>
  );
}
