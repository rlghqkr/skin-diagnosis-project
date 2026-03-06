import { useState, useEffect } from "react";
import { Sun, Moon, Plus, Flame, Save, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useRoutineStore } from "../../stores/useRoutineStore";
import RoutineStepCard from "./RoutineStepCard";
import ProductSearchInput from "./ProductSearchInput";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"] as const;

function formatKoreanDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dayName = DAY_NAMES[d.getDay()];
  return `${y}.${m}.${day} (${dayName})`;
}

export default function RoutineForm() {
  const {
    routines,
    currentDate,
    activeTab,
    streak,
    isLoading,
    setActiveTab,
    toggleStep,
    addStep,
    removeStep,
    saveRoutine,
    fetchRoutines,
    fetchStreak,
  } = useRoutineStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch routines from API when date changes
  useEffect(() => {
    fetchRoutines(currentDate);
  }, [currentDate, fetchRoutines]);

  // Fetch streak on mount
  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  const routine = routines[currentDate];
  const steps = routine?.[activeTab] ?? [];
  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const displayStreak = routine?.streak ?? streak;

  const handleSave = async () => {
    await saveRoutine(currentDate, activeTab);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div>
      {/* Morning / Night tab */}
      <div className="mx-4 flex rounded-xl bg-[#F2F4F6] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("morning")}
          className={clsx(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold transition-all",
            activeTab === "morning"
              ? "bg-white text-[#191F28] shadow-sm"
              : "text-[#8B95A1]",
          )}
        >
          <Sun size={16} />
          아침 루틴
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("night")}
          className={clsx(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold transition-all",
            activeTab === "night"
              ? "bg-white text-[#191F28] shadow-sm"
              : "text-[#8B95A1]",
          )}
        >
          <Moon size={16} />
          저녁 루틴
        </button>
      </div>

      {/* Date & progress */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[#8B95A1]">
              {formatKoreanDate(currentDate)} {activeTab === "morning" ? "아침" : "저녁"} 루틴
            </p>
            <p className="mt-0.5 text-[12px] text-[#B0B8C1]">
              완료: {completedCount}/{totalCount}
            </p>
          </div>
          {displayStreak > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-[#FFF3E0] px-2.5 py-1">
              <Flame size={14} className="text-[#FF9800]" />
              <span className="text-[12px] font-bold text-[#FF9800]">
                {displayStreak}일 연속
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F2F4F6]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(135deg, #5B8CFF, #7ED7C1)",
            }}
          />
        </div>
        <p className="mt-1 text-right text-[11px] text-[#B0B8C1]">{progress}%</p>
      </div>

      {/* Steps */}
      <div className="mt-4 px-4">
        <h3 className="mb-3 text-[13px] font-bold text-[#191F28]">
          나의 {activeTab === "morning" ? "아침" : "저녁"} 루틴
        </h3>
        <div className="space-y-2.5">
          {steps.map((step) => (
            <RoutineStepCard
              key={step.id}
              step={step}
              onToggle={() => toggleStep(currentDate, activeTab, step.id)}
              onRemove={() => removeStep(currentDate, activeTab, step.id)}
            />
          ))}
        </div>

        {/* Add product button */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D1D6DB] py-3.5 text-[13px] font-medium text-[#8B95A1] transition-colors active:border-[#5B8CFF] active:text-[#5B8CFF]"
        >
          <Plus size={16} />
          제품 추가하기
        </button>

        {/* Save button */}
        {steps.length > 0 && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className={clsx(
              "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-semibold text-white transition-all active:brightness-95",
              saveSuccess
                ? "bg-[#30D158]"
                : "shadow-[0_4px_16px_rgba(91,140,255,0.25)]",
            )}
            style={
              saveSuccess
                ? undefined
                : { background: "linear-gradient(135deg, #5B8CFF, #7ED7C1)" }
            }
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : saveSuccess ? (
              "저장 완료!"
            ) : (
              <>
                <Save size={16} />
                루틴 저장하기
              </>
            )}
          </button>
        )}
      </div>

      <ProductSearchInput
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(product) => addStep(currentDate, activeTab, product)}
      />
    </div>
  );
}
