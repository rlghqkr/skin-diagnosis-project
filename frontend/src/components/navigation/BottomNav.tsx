import { NavLink } from "react-router-dom";
import { Home, BarChart3, ShoppingBag, User, Camera } from "lucide-react";
import clsx from "clsx";

interface Props {
  onOpenPhotoSheet?: () => void;
}

const LEFT_TABS = [
  { to: "/", icon: Home, label: "홈" },
  { to: "/results/dashboard", icon: BarChart3, label: "결과" },
] as const;

const RIGHT_TABS = [
  { to: "/recommendations", icon: ShoppingBag, label: "추천" },
  { to: "/profile", icon: User, label: "프로필" },
] as const;

export default function BottomNav({ onOpenPhotoSheet }: Props) {
  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E8EB] bg-white">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {LEFT_TABS.map(({ to, icon: Icon, label }) => (
          <TabLink key={to} to={to} icon={Icon} label={label} />
        ))}

        {/* Center analyze button */}
        <div className="relative flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={onOpenPhotoSheet}
            className="relative -mt-5 flex h-12 w-12 items-center justify-center rounded-full shadow-[0_4px_12px_rgba(91,140,255,0.35)]"
            style={{ background: "linear-gradient(135deg, #5B8CFF, #7ED7C1)" }}
          >
            <Camera size={22} className="text-white" />
          </button>
          <span className="mt-0.5 text-[10px] font-medium text-[#5B8CFF]">분석</span>
        </div>

        {RIGHT_TABS.map(({ to, icon: Icon, label }) => (
          <TabLink key={to} to={to} icon={Icon} label={label} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof Home;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        clsx(
          "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-colors duration-200",
          isActive
            ? "text-[#5B8CFF]"
            : "text-[#8B95A1] active:text-[#4E5968]",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
          <span
            className={clsx(
              "text-[10px] tracking-wide",
              isActive ? "font-semibold" : "font-normal",
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
