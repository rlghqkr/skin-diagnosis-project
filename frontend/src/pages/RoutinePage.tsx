import { useState, useEffect } from "react";
import { Droplets, LogIn, UserCheck } from "lucide-react";
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
      {/* Page header */}
      <div className="bg-card px-5 pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <Droplets size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground">스킨케어 루틴</h1>
            <p className="text-[12px] text-muted-foreground">매일 기록하고 피부 변화를 추적하세요</p>
          </div>
          {isAuthenticated ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ECFDF5]">
              <UserCheck size={16} className="text-[#059669]" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="flex h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-[13px] font-medium text-muted-foreground transition-all active:scale-[0.97] active:bg-secondary"
            >
              <LogIn size={15} />
              로그인
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-background pt-4">
        <RoutineTimeline />
      </div>

      {/* Routine form */}
      <div className="flex-1 bg-background pt-5 pb-6">
        <RoutineForm />
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
