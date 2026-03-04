import { Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useHealth } from "../../hooks/useHealth";
import clsx from "clsx";

export default function Header() {
  const { health, error } = useHealth();
  const online = !!health && !error;

  return (
    <header className="safe-top sticky top-0 relative z-20 border-b border-white/[0.04] bg-dark-950/60 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Brand — clickable to go home */}
        <Link
          to="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          {/* Logo mark */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/15">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          </div>
          <h1 className="font-brand text-lg text-cream-200">
            Namju
          </h1>
        </Link>

        {/* Server status */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Activity
              size={14}
              className={clsx(
                "transition-colors duration-300",
                online ? "text-emerald-400/70" : "text-red-400/70",
              )}
            />
            {online && (
              <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </div>
          <span
            className={clsx(
              "text-xs font-light tracking-wide transition-colors duration-300",
              online ? "text-white/40" : "text-red-400/60",
            )}
          >
            {online ? "서버 연결됨" : "연결 끊김"}
          </span>
        </div>
      </div>
    </header>
  );
}
