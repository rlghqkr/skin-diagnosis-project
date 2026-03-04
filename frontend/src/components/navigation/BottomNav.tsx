import { NavLink } from "react-router-dom";
import { Home, Camera, BarChart3, ShoppingBag } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "홈" },
  { to: "/camera", icon: Camera, label: "촬영" },
  { to: "/results", icon: BarChart3, label: "결과" },
  { to: "/recommendations", icon: ShoppingBag, label: "추천" },
] as const;

export default function BottomNav() {
  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E8EB] bg-white">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-colors duration-200",
                isActive
                  ? "text-[#3182F6]"
                  : "text-[#8B95A1] active:text-[#4E5968]",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className={clsx(
                  "text-[10px] tracking-wide",
                  isActive ? "font-semibold" : "font-normal"
                )}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
