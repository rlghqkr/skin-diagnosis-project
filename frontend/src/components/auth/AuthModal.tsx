import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Lock, User, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "../../stores/useAuthStore";
import { useOverlayStore } from "../../stores/useOverlayStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const { pushOverlay, popOverlay } = useOverlayStore();

  useEffect(() => {
    if (open) {
      pushOverlay();
      return () => popOverlay();
    }
  }, [open, pushOverlay, popOverlay]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ email, nickname, password });
      }
      onClose();
    } catch {
      // error is set in store
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    clearError();
  };

  // Portal to document.body — escapes any stacking context
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="animate-slide-up relative w-full max-w-lg rounded-t-3xl bg-white px-6 pt-4 pb-8 safe-bottom">
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D1D6DB]" />

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#191F28]">
            {mode === "login" ? "로그인" : "회원가입"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#8B95A1] active:bg-[#F2F4F6]"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div className="flex items-center gap-2 rounded-xl bg-[#F2F4F6] px-3 py-3">
              <User size={18} className="text-[#8B95A1]" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임"
                required
                className="flex-1 bg-transparent text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-[#F2F4F6] px-3 py-3">
            <Mail size={18} className="text-[#8B95A1]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              required
              className="flex-1 bg-transparent text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-[#F2F4F6] px-3 py-3">
            <Lock size={18} className="text-[#8B95A1]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (8자 이상)"
              required
              minLength={8}
              className="flex-1 bg-transparent text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none"
            />
          </div>

          {error && (
            <p className="text-[12px] text-[#F04452]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-semibold text-white shadow-[0_4px_16px_rgba(91,140,255,0.25)] active:brightness-95 transition-all"
            style={{ background: "linear-gradient(135deg, #5B8CFF, #7ED7C1)" }}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : mode === "login" ? (
              "로그인"
            ) : (
              "회원가입"
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={switchMode}
          className="mt-4 w-full text-center text-[13px] text-[#8B95A1]"
        >
          {mode === "login" ? (
            <>
              계정이 없으신가요?{" "}
              <span className={clsx("font-semibold text-[#5B8CFF]")}>회원가입</span>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{" "}
              <span className={clsx("font-semibold text-[#5B8CFF]")}>로그인</span>
            </>
          )}
        </button>
      </div>
    </div>,
    document.body,
  );
}
