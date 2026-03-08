import { Link } from "react-router-dom";
import { useHealth } from "../../hooks/useHealth";

export default function Header() {
  const { isHealthy } = useHealth();

  return (
    <header className="safe-top sticky top-0 z-50 flex items-center justify-between px-5 py-3 bg-card border-b border-border">
      <Link
        to="/"
        className="transition-opacity active:opacity-70"
      >
        <span className="text-[18px] font-semibold text-foreground tracking-tight">
          SkinNerd
        </span>
      </Link>
      <span className="flex items-center gap-1.5 rounded-full px-3 py-1"
        style={{
          backgroundColor: isHealthy ? "#E8F5E9" : "#FFEBEE",
        }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: isHealthy ? "#4CAF50" : "#EF5350" }}
        />
        <span
          className="text-[12px] font-medium"
          style={{ color: isHealthy ? "#2E7D32" : "#C62828" }}
        >
          {isHealthy ? "서버 연결됨" : "연결 안됨"}
        </span>
      </span>
    </header>
  );
}
