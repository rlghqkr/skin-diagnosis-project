import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Droplets, User, Camera, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { useOverlayStore } from "../../stores/useOverlayStore";

interface Props {
  onOpenPhotoSheet?: () => void;
}

const LEFT_TABS = [
  { to: "/", icon: Home, label: "홈" },
  { to: "/routine", icon: Droplets, label: "루틴" },
] as const;

const RIGHT_TABS = [
  { to: "/tracking", icon: TrendingUp, label: "리포트" },
  { to: "/profile", icon: User, label: "프로필" },
] as const;

const SCROLL_THRESHOLD = 8;

export default function BottomNav({ onOpenPhotoSheet }: Props) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const overlayCount = useOverlayStore((s) => s.overlayCount);
  const hasOverlay = overlayCount > 0;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (delta > SCROLL_THRESHOLD) {
        setVisible(false);       // scrolling down → hide
      } else if (delta < -SCROLL_THRESHOLD) {
        setVisible(true);        // scrolling up → show
      }

      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={clsx(
        "safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E8EB] bg-white transition-transform duration-300",
        visible && !hasOverlay ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2.5">
        {LEFT_TABS.map(({ to, icon: Icon, label }) => (
          <TabLink key={to} to={to} icon={Icon} label={label} />
        ))}

        {/* Center analyze button — 64px, lifted */}
        <div className="relative flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={onOpenPhotoSheet}
            className="relative -mt-7 flex h-16 w-16 items-center justify-center rounded-full shadow-[0_4px_16px_rgba(91,140,255,0.35)]"
            style={{ background: "linear-gradient(135deg, #5B8CFF, #7ED7C1)" }}
          >
            <Camera size={28} className="text-white" />
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
