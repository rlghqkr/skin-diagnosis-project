import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  CalendarDays,
} from "lucide-react";
import clsx from "clsx";
import { useRoutineStore } from "../../stores/useRoutineStore";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"] as const;

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getDates(centerDate: string) {
  const center = new Date(centerDate + "T00:00:00");
  const dates: string[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(center);
    d.setDate(d.getDate() + i);
    dates.push(toDateStr(d));
  }
  return dates;
}

function getMonthDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(toDateStr(new Date(year, month, d)));
  }
  return cells;
}

export default function RoutineTimeline() {
  const { routines, currentDate, setCurrentDate } = useRoutineStore();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const current = new Date(currentDate + "T00:00:00");
  const [viewYear, setViewYear] = useState(current.getFullYear());
  const [viewMonth, setViewMonth] = useState(current.getMonth());

  const dates = getDates(currentDate);
  const todayStr = toDateStr(new Date());

  const handlePrev = () => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    setCurrentDate(toDateStr(d));
  };

  const handleNext = () => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    if (toDateStr(d) <= todayStr) {
      setCurrentDate(toDateStr(d));
    }
  };

  const handleMonthPrev = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleMonthNext = () => {
    const now = new Date();
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    if (nextYear > now.getFullYear() || (nextYear === now.getFullYear() && nextMonth > now.getMonth())) return;
    setViewYear(nextYear);
    setViewMonth(nextMonth);
  };

  const handleDateSelect = (date: string) => {
    if (date <= todayStr) {
      setCurrentDate(date);
      setCalendarOpen(false);
    }
  };

  const handleToggleCalendar = () => {
    if (!calendarOpen) {
      const c = new Date(currentDate + "T00:00:00");
      setViewYear(c.getFullYear());
      setViewMonth(c.getMonth());
    }
    setCalendarOpen((v) => !v);
  };

  const getRoutineStatus = (date: string) => {
    const routine = routines[date];
    if (!routine) return "none";
    const morningDone = routine.morning.length > 0 && routine.morning.every((s) => s.completed);
    const nightDone = routine.night.length > 0 && routine.night.every((s) => s.completed);
    if (morningDone && nightDone) return "complete";
    return "partial";
  };

  const now = new Date();
  const isNextMonthDisabled =
    (viewMonth === 11 ? viewYear + 1 : viewYear) > now.getFullYear() ||
    ((viewMonth === 11 ? viewYear + 1 : viewYear) === now.getFullYear() &&
      (viewMonth === 11 ? 0 : viewMonth + 1) > now.getMonth());

  return (
    <div className="px-4">
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Month header */}
        <button
          type="button"
          onClick={handleToggleCalendar}
          className="flex w-full items-center justify-center gap-2 px-4 min-h-[48px] transition-colors active:bg-[#F9FAFB]"
        >
          <CalendarDays size={16} className="text-[#5B8CFF]" />
          <span className="text-[14px] font-bold text-[#191F28]">
            {current.getFullYear()}년 {current.getMonth() + 1}월
          </span>
          <ChevronRight
            size={14}
            className={clsx(
              "text-[#8B95A1] transition-transform duration-200",
              calendarOpen && "rotate-90",
            )}
          />
        </button>

        {/* Weekly strip (default view) */}
        {!calendarOpen && (
          <div className="flex items-center px-1 pb-3">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-[#8B95A1] active:bg-[#F2F4F6]"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex flex-1 justify-between">
              {dates.map((date) => {
                const d = new Date(date + "T00:00:00");
                const dayNum = d.getDate();
                const dayName = DAY_NAMES[d.getDay()];
                const isSelected = date === currentDate;
                const isToday = date === todayStr;
                const isFuture = date > todayStr;
                const status = getRoutineStatus(date);

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => !isFuture && setCurrentDate(date)}
                    disabled={isFuture}
                    className={clsx(
                      "flex min-w-[44px] flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 transition-all active:scale-[0.95]",
                      isSelected
                        ? "bg-[#5B8CFF] text-white shadow-sm"
                        : isFuture
                          ? "text-[#D1D6DB]"
                          : "text-[#6B7684] active:bg-[#F2F4F6]",
                    )}
                  >
                    <span className={clsx("text-[11px]", isSelected ? "font-semibold" : "font-normal")}>
                      {dayName}
                    </span>
                    <span className={clsx("text-[15px]", isSelected || isToday ? "font-bold" : "font-medium")}>
                      {dayNum}
                    </span>
                    <span className="flex h-3.5 items-center">
                      {status === "complete" ? (
                        <CheckCircle2 size={12} className={isSelected ? "text-white" : "text-[#30D158]"} />
                      ) : status === "partial" ? (
                        <Circle size={12} className={isSelected ? "text-white/60" : "text-[#D1D6DB]"} />
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
                "flex h-11 w-9 shrink-0 items-center justify-center rounded-lg active:bg-[#F2F4F6]",
                currentDate >= todayStr ? "text-[#D1D6DB]" : "text-[#8B95A1]",
              )}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Monthly calendar (expanded view) */}
        {calendarOpen && (
          <div className="px-4 pb-4">
            {/* Month navigation */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleMonthPrev}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-[#8B95A1] active:bg-[#F2F4F6]"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-[#191F28]">
                {viewYear}년 {viewMonth + 1}월
              </span>
              <button
                type="button"
                onClick={handleMonthNext}
                disabled={isNextMonthDisabled}
                className={clsx(
                  "flex h-11 w-11 items-center justify-center rounded-lg active:bg-[#F2F4F6]",
                  isNextMonthDisabled ? "text-[#D1D6DB]" : "text-[#8B95A1]",
                )}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Day name headers */}
            <div className="mb-1 grid grid-cols-7 text-center">
              {DAY_NAMES.map((name, i) => (
                <span
                  key={name}
                  className={clsx(
                    "py-1 text-[11px] font-medium",
                    i === 0 ? "text-[#F04452]" : i === 6 ? "text-[#3B82F6]" : "text-[#8B95A1]",
                  )}
                >
                  {name}
                </span>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {getMonthDates(viewYear, viewMonth).map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="h-11" />;
                }

                const d = new Date(date + "T00:00:00");
                const dayNum = d.getDate();
                const isSelected = date === currentDate;
                const isToday = date === todayStr;
                const isFuture = date > todayStr;
                const status = getRoutineStatus(date);
                const dayOfWeek = d.getDay();

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    disabled={isFuture}
                    className={clsx(
                      "relative flex h-11 flex-col items-center justify-center rounded-xl transition-all",
                      isSelected
                        ? "bg-[#5B8CFF] text-white"
                        : isFuture
                          ? "text-[#D1D6DB]"
                          : "active:bg-[#F2F4F6]",
                      !isSelected && !isFuture && dayOfWeek === 0 && "text-[#F04452]",
                      !isSelected && !isFuture && dayOfWeek === 6 && "text-[#3B82F6]",
                      !isSelected && !isFuture && dayOfWeek !== 0 && dayOfWeek !== 6 && "text-[#4E5968]",
                    )}
                  >
                    <span
                      className={clsx(
                        "text-[13px]",
                        isSelected || isToday ? "font-bold" : "font-medium",
                        isToday && !isSelected && "underline underline-offset-2 decoration-[#5B8CFF]",
                      )}
                    >
                      {dayNum}
                    </span>
                    {status !== "none" && (
                      <span
                        className={clsx(
                          "absolute bottom-1 h-1 w-1 rounded-full",
                          status === "complete"
                            ? isSelected ? "bg-white" : "bg-[#30D158]"
                            : isSelected ? "bg-white/50" : "bg-[#D1D6DB]",
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
