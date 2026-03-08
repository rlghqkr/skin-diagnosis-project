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
          "group relative flex w-full min-h-[48px] cursor-pointer items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all",
          dragging && "!bg-accent",
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
        <Upload size={16} className="text-muted-foreground transition-colors group-hover:text-primary" />
        <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-[#4E5968]">
          다른 이미지로 교체
        </span>
      </div>
    );
  }

  // Full upload area (hero state)
  return (
    <div
      className={clsx(
        "group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary p-8 transition-all duration-300",
        dragging
          ? "!border-primary !bg-accent scale-[1.01]"
          : "hover:!border-primary hover:!bg-accent/50",
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

      <div className="relative mb-6">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
          <ImagePlus
            size={28}
            className="text-primary/50 transition-colors duration-300 group-hover:text-primary"
          />
        </div>
      </div>

      <p className="mb-1.5 text-sm font-semibold text-[#4E5968] transition-colors group-hover:text-foreground">
        사진을 업로드하세요
      </p>
      <p className="text-xs text-muted-foreground">
        클릭 또는 드래그 &middot; 정면 얼굴 사진 권장
      </p>
    </div>
  );
}
