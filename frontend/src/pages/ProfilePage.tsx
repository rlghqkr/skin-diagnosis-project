import { useNavigate } from "react-router-dom";
import { User, Trash2, Info, ChevronRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAnalysisHistory } from "../hooks/useAnalysisHistory";
import { formatDate, formatRelativeDate } from "../utils/formatDate";

function getScoreColor(score: number): string {
  if (score >= 80) return "#34C759";
  if (score >= 60) return "#5B8CFF";
  if (score >= 40) return "#FF9F0A";
  return "#F04452";
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { records, clearHistory } = useAnalysisHistory();

  const chartData = [...records]
    .reverse()
    .map((r) => ({
      date: new Date(r.timestamp).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
      score: r.score,
    }));

  const handleClear = () => {
    if (window.confirm("모든 분석 기록을 삭제하시겠습니까?")) {
      clearHistory();
    }
  };

  return (
    <div className="px-5 py-6 pb-24">
      {/* Profile Header */}
      <div className="mb-6 flex flex-col items-center">
        <div
          className="mb-3 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #5B8CFF, #7ED7C1)" }}
        >
          <User size={36} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-[#191F28]">피부 관리 기록</h2>
        <p className="mt-1 text-xs text-[#8B95A1]">총 {records.length}회 분석</p>
      </div>

      {/* Score Trend Chart */}
      {chartData.length >= 2 && (
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h3 className="mb-3 text-sm font-bold text-[#191F28]">점수 변화 추이</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#8B95A1" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#8B95A1" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E8EB",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#5B8CFF"
                strokeWidth={2}
                dot={{ fill: "#5B8CFF", r: 3 }}
                activeDot={{ r: 5, fill: "#5B8CFF" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Analysis History List */}
      {records.length > 0 ? (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-bold text-[#191F28]">분석 기록</h3>
          <div className="space-y-2">
            {records.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() =>
                  navigate("/results/dashboard", {
                    state: { analyzeResult: record.fullResult },
                  })
                }
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:brightness-95 transition-all text-left"
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: getScoreColor(record.score) }}
                >
                  {record.score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#191F28]">
                    {formatDate(record.timestamp)}
                  </p>
                  <p className="text-xs text-[#8B95A1]">
                    {record.skinType
                      ? `${record.skinType === "dry" ? "건성" : record.skinType === "oily" ? "지성" : record.skinType === "combination" ? "복합성" : "민감성"} · `
                      : ""}
                    {formatRelativeDate(record.timestamp)}
                  </p>
                </div>
                <ChevronRight size={14} className="text-[#D1D6DB]" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#8B95A1]">아직 분석 기록이 없습니다</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-3 text-sm font-medium text-[#5B8CFF]"
          >
            첫 분석 시작하기 →
          </button>
        </div>
      )}

      {/* Settings */}
      <div className="space-y-2">
        <h3 className="mb-3 text-sm font-bold text-[#191F28]">설정</h3>
        <button
          type="button"
          onClick={handleClear}
          className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:brightness-95 transition-all text-left"
        >
          <Trash2 size={16} className="text-[#F04452]" />
          <span className="flex-1 text-sm text-[#191F28]">데이터 초기화</span>
          <ChevronRight size={14} className="text-[#D1D6DB]" />
        </button>
        <div className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <Info size={16} className="text-[#8B95A1]" />
          <span className="flex-1 text-sm text-[#191F28]">앱 정보</span>
          <span className="text-xs text-[#8B95A1]">SkinNerd AI v1.0</span>
        </div>
      </div>
    </div>
  );
}
