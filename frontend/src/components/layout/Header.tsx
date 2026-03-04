import { Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useHealth } from "../../hooks/useHealth";
import clsx from "clsx";

export default function Header() {
  const { health, error } = useHealth();
  const online = !!health && !error;

  return (
    <header className="safe-top sticky top-0 relative z-20 border-b border-[#E5E8EB] bg-white">
      <div className="flex items-center justify-between px-5 py-3">
        {/* Brand */}
        <Link
          to="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F3FF]">
            <div className="h-2.5 w-2.5 rounded-full bg-[#3182F6]" />
          </div>
          <h1 className="font-brand text-lg text-[#191F28]">
            SkinNerd AI
          </h1>
        </Link>

        {/* Server status */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Activity
              size={14}
              className={clsx(
                "transition-colors duration-300",
                online ? "text-[#30D158]" : "text-[#F04452]",
              )}
            />
            {online && (
              <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#30D158]" />
            )}
          </div>
          <span
            className={clsx(
              "text-xs tracking-wide transition-colors duration-300",
              online ? "text-[#8B95A1]" : "text-[#F04452]",
            )}
          >
            {online ? "서버 연결됨" : "연결 끊김"}
          </span>
        </div>
      </div>
    </header>
  );
}
