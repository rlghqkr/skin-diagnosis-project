import { useCallback, useRef, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import clsx from "clsx";

interface Props {
  onSelect: (file: File) => void;
  previewUrl: string | null;
}

export default function ImageUploader({ onSelect, previewUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (file && file.type.startsWith("image/")) onSelect(file);
    },
    [onSelect],
  );

  // Compact mode (for image replacement)
  if (!previewUrl && previewUrl === null) {
    return (
      <div
        className={clsx(
          "card card-hover group relative flex w-full min-h-[48px] cursor-pointer items-center justify-center gap-3 rounded-2xl px-6 py-4 transition-all",
          dragging && "!border-rose-400/30 !bg-rose-400/5",
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Upload size={16} className="text-white/30 transition-colors group-hover:text-rose-400/60" />
        <span className="text-xs font-light tracking-wide text-white/30 transition-colors group-hover:text-white/50">
          다른 이미지로 교체
        </span>
      </div>
    );
  }

  // Full upload area (hero state)
  return (
    <div
      className={clsx(
        "glass-card group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl p-8 transition-all duration-300",
        dragging
          ? "!border-rose-400/30 !bg-rose-400/5 scale-[1.01]"
          : "hover:!border-white/10 hover:!bg-white/[0.03]",
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* Icon */}
      <div className="relative mb-6">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
          <ImagePlus
            size={28}
            className="text-white/20 transition-colors duration-300 group-hover:text-rose-400/50"
          />
        </div>
      </div>

      <p className="mb-1.5 text-sm font-medium tracking-wide text-white/40 transition-colors group-hover:text-white/60">
        사진을 업로드하세요
      </p>
      <p className="text-xs font-light text-white/20">
        클릭 또는 드래그 &middot; 정면 얼굴 사진 권장
      </p>
    </div>
  );
}
