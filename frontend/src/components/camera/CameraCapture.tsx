import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Check, X, ImagePlus, SwitchCamera } from "lucide-react";
import FaceGuideOverlay from "./FaceGuideOverlay";

interface Props {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

type CameraState = "initializing" | "ready" | "error" | "preview";

export default function CameraCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("initializing");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    setState("initializing");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setState("ready");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "카메라 접근 실패";
      if (message.includes("NotAllowed") || message.includes("Permission")) {
        setErrorMsg("카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.");
      } else if (message.includes("NotFound") || message.includes("DevicesNotFound")) {
        setErrorMsg("카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.");
      } else {
        setErrorMsg("카메라를 시작할 수 없습니다: " + message);
      }
      setState("error");
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitchCamera = useCallback(() => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setCapturedFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        setState("preview");

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      },
      "image/jpeg",
      0.92,
    );
  }, [facingMode]);

  const handleRetake = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCapturedFile(null);
    startCamera(facingMode);
  }, [previewUrl, facingMode, startCamera]);

  const handleConfirm = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile);
    }
  }, [capturedFile, onCapture]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File | undefined) => {
      if (file && file.type.startsWith("image/")) {
        onCapture(file);
      }
    },
    [onCapture],
  );

  // Error state
  if (state === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
        <div className="animate-float-in flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF0F0]">
            <Camera size={28} className="text-[#F04452]" />
          </div>
          <p className="mb-6 max-w-xs text-sm leading-relaxed text-[#4E5968]">
            {errorMsg}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => startCamera(facingMode)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#3182F6] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(49,130,246,0.3)]"
            >
              <RefreshCw size={16} />
              다시 시도
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#F2F4F6] px-6 py-3.5 text-sm font-medium text-[#4E5968]"
            >
              <ImagePlus size={16} />
              갤러리에서 선택
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-[#8B95A1] py-2"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preview state
  if (state === "preview" && previewUrl) {
    return (
      <div className="flex flex-col items-center px-4 py-4">
        <div className="relative w-full overflow-hidden rounded-2xl">
          <img
            src={previewUrl}
            alt="촬영된 사진"
            className="w-full object-contain"
          />
        </div>

        <div className="mt-6 flex w-full gap-3">
          <button
            type="button"
            onClick={handleRetake}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#F2F4F6] py-4 text-sm font-medium text-[#4E5968]"
          >
            <RefreshCw size={16} />
            재촬영
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#3182F6] py-4 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(49,130,246,0.3)]"
          >
            <Check size={16} />
            이 사진으로 분석
          </button>
        </div>
      </div>
    );
  }

  // Camera viewfinder
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-full overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full object-cover"
          style={{
            transform: facingMode === "user" ? "scaleX(-1)" : "none",
            minHeight: "60vh",
          }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {state === "ready" && <FaceGuideOverlay />}

        {state === "initializing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-[#E5E8EB] border-t-[#3182F6] animate-spin" />
              <p className="text-sm text-white/60">카메라 준비 중...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex w-full items-center justify-between px-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F2F4F6] text-[#4E5968]"
        >
          <X size={20} />
        </button>

        <button
          type="button"
          onClick={handleCapture}
          disabled={state !== "ready"}
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#3182F6] bg-white transition-transform active:scale-90 disabled:border-[#E5E8EB] disabled:bg-[#F2F4F6]"
        >
          <div className="h-12 w-12 rounded-full bg-[#3182F6] disabled:bg-[#E5E8EB]" />
        </button>

        <button
          type="button"
          onClick={handleSwitchCamera}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F2F4F6] text-[#4E5968]"
        >
          <SwitchCamera size={20} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-4 flex items-center gap-2 text-sm text-[#8B95A1]"
      >
        <ImagePlus size={14} />
        갤러리에서 선택
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
      />
    </div>
  );
}
