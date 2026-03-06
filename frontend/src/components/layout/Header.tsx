import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="safe-top sticky top-0 relative z-20 border-b border-[#E5E8EB] bg-white/95 backdrop-blur-sm">
      <div className="flex items-center px-5 py-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity active:opacity-70"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBF1FF]">
            <div className="h-2.5 w-2.5 rounded-full bg-[#5B8CFF]" />
          </div>
          <h1 className="font-brand text-[17px] text-[#191F28]">
            SkinNerd AI
          </h1>
        </Link>
      </div>
    </header>
  );
}
