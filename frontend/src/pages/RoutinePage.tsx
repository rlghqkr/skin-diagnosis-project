import { useState, useEffect } from "react";
import { Droplets, LogIn } from "lucide-react";
import RoutineTimeline from "../components/routine/RoutineTimeline";
import RoutineForm from "../components/routine/RoutineForm";
import AuthModal from "../components/auth/AuthModal";
import { useAuthStore } from "../stores/useAuthStore";

export default function RoutinePage() {
  const { isAuthenticated, fetchUser } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="flex min-h-[calc(100dvh-120px)] flex-col pb-24">
      {/* Hero */}
      <div className="bg-white px-4 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #EBF1FF, #E0F5EE)" }}
          >
            <Droplets size={20} className="text-[#5B8CFF]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#191F28]">
              스킨케어 루틴
            </h1>
            <p className="text-[12px] text-[#8B95A1]">
              매일 루틴을 기록하고 피부 변화를 추적하세요
            </p>
          </div>
          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#EBF1FF] px-3 py-2 text-[12px] font-semibold text-[#5B8CFF] transition-colors active:bg-[#D6E4FF]"
            >
              <LogIn size={14} />
              로그인
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-[#F7F9FC] pt-4">
        <RoutineTimeline />
      </div>

      {/* Routine form */}
      <div className="flex-1 bg-[#F7F9FC] pt-5 pb-6">
        <RoutineForm />
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
