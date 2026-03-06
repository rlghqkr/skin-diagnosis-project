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
    <div className="flex min-h-[calc(100dvh-120px)] flex-col pb-24">
      {/* Profile Header */}
      <div className="bg-white px-5 pt-6 pb-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #5B8CFF, #7ED7C1)" }}
          >
            <User size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#191F28]">피부 관리 기록</h1>
            <p className="mt-0.5 text-[13px] text-[#8B95A1]">총 {records.length}회 분석 완료</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#F7F9FC] px-5 pt-5">
        <div className="mx-auto w-full max-w-lg space-y-5">
          {/* Score Trend Chart */}
          {chartData.length >= 2 && (
            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <h3 className="mb-4 text-[13px] font-bold text-[#8B95A1] tracking-wide">점수 변화 추이</h3>
              <ResponsiveContainer width="100%" height={160}>
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
                    width={28}
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

          {/* Analysis History */}
          {records.length > 0 ? (
            <div>
              <h3 className="mb-3 text-[13px] font-bold text-[#8B95A1] tracking-wide">분석 기록</h3>
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
                    className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] active:scale-[0.99] transition-all text-left"
                  >
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
                      style={{ backgroundColor: getScoreColor(record.score) }}
                    >
                      {record.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#191F28]">
                        {formatDate(record.timestamp)}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#8B95A1]">
                        {record.skinType
                          ? `${record.skinType === "dry" ? "건성" : record.skinType === "oily" ? "지성" : record.skinType === "combination" ? "복합성" : "민감성"} · `
                          : ""}
                        {formatRelativeDate(record.timestamp)}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-[#D1D6DB]" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F2F4F6]">
                <User size={20} className="text-[#8B95A1]" />
              </div>
              <p className="text-[14px] font-medium text-[#4E5968]">아직 분석 기록이 없습니다</p>
              <p className="mt-1 text-[12px] text-[#8B95A1]">첫 분석을 시작해보세요</p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#5B8CFF] px-6 text-[14px] font-semibold text-white transition-all active:scale-[0.97]"
              >
                분석 시작하기
              </button>
            </div>
          )}

          {/* Settings */}
          <div>
            <h3 className="mb-3 text-[13px] font-bold text-[#8B95A1] tracking-wide">설정</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] active:scale-[0.99] transition-all text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEF2F2]">
                  <Trash2 size={16} className="text-[#F04452]" />
                </div>
                <span className="flex-1 text-[14px] text-[#191F28]">데이터 초기화</span>
                <ChevronRight size={16} className="text-[#D1D6DB]" />
              </button>
              <div className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F4F6]">
                  <Info size={16} className="text-[#8B95A1]" />
                </div>
                <span className="flex-1 text-[14px] text-[#191F28]">앱 정보</span>
                <span className="text-[12px] text-[#8B95A1]">v1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
