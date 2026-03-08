import { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ImagePlus, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PhotoCaptureSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (file && file.type.startsWith("image/")) {
        onClose();
        navigate("/analysis", { state: { file } });
      }
    },
    [navigate, onClose],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="animate-slide-up relative w-full max-w-lg rounded-t-3xl bg-card px-5 pb-8 pt-3 safe-bottom">
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />

        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">사진 선택</h3>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground active:bg-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => { onClose(); navigate("/camera"); }}
            className="flex w-full items-center gap-3 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-white active:brightness-95 transition-all"
          >
            <Camera size={20} />
            카메라로 촬영하기
          </button>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-2xl bg-secondary px-5 py-4 text-sm font-medium text-secondary-foreground transition-all active:brightness-95"
          >
            <ImagePlus size={18} className="text-muted-foreground" />
            갤러리에서 사진 선택
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <button
            type="button"
            onClick={onClose}
            className="mt-1 w-full rounded-2xl py-3.5 text-sm font-medium text-muted-foreground active:bg-secondary transition-all"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
