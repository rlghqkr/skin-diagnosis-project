import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import clsx from "clsx";
import { useRoutineStore } from "../../stores/useRoutineStore";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"] as const;

function getDates(centerDate: string) {
  const center = new Date(centerDate + "T00:00:00");
  const dates: string[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(center);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function RoutineTimeline() {
  const { routines, currentDate, setCurrentDate } = useRoutineStore();
  const dates = getDates(currentDate);
  const todayStr = new Date().toISOString().slice(0, 10);

  const handlePrev = () => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().slice(0, 10));
  };

  const handleNext = () => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    if (d.toISOString().slice(0, 10) <= todayStr) {
      setCurrentDate(d.toISOString().slice(0, 10));
    }
  };

  return (
    <div className="px-4">
      <div className="flex items-center justify-between rounded-2xl bg-white px-2 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={handlePrev}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-[#8B95A1] active:bg-[#F2F4F6]"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex gap-1">
          {dates.map((date) => {
            const d = new Date(date + "T00:00:00");
            const dayNum = d.getDate();
            const dayName = DAY_NAMES[d.getDay()];
            const isSelected = date === currentDate;
            const isToday = date === todayStr;
            const routine = routines[date];
            const isFuture = date > todayStr;

            const morningDone = routine?.morning.every((s) => s.completed) && (routine?.morning.length ?? 0) > 0;
            const nightDone = routine?.night.every((s) => s.completed) && (routine?.night.length ?? 0) > 0;
            const allDone = morningDone && nightDone;

            return (
              <button
                key={date}
                type="button"
                onClick={() => !isFuture && setCurrentDate(date)}
                disabled={isFuture}
                className={clsx(
                  "flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-2.5 transition-all",
                  isSelected
                    ? "bg-[#5B8CFF] text-white"
                    : isFuture
                      ? "text-[#D1D6DB]"
                      : "text-[#6B7684] active:bg-[#F2F4F6]",
                )}
              >
                <span className={clsx("text-[10px]", isSelected ? "font-semibold" : "font-normal")}>
                  {dayName}
                </span>
                <span className={clsx("text-[14px]", isSelected || isToday ? "font-bold" : "font-medium")}>
                  {dayNum}
                </span>
                <span className="flex h-3 items-center">
                  {allDone ? (
                    <CheckCircle2 size={10} className={isSelected ? "text-white" : "text-[#30D158]"} />
                  ) : routine ? (
                    <Circle size={10} className={isSelected ? "text-white/60" : "text-[#D1D6DB]"} />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentDate >= todayStr}
          className={clsx(
            "flex h-11 w-11 items-center justify-center rounded-lg active:bg-[#F2F4F6]",
            currentDate >= todayStr ? "text-[#D1D6DB]" : "text-[#8B95A1]",
          )}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
