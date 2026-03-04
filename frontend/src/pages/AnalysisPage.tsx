import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { useAnalyze } from "../hooks/useAnalyze";
import ImageUploader from "../components/upload/ImageUploader";
import FaceAnalysisView from "../components/face/FaceAnalysisView";
import AnalysisLoading from "../components/analysis/AnalysisLoading";
import ErrorAlert from "../components/common/ErrorAlert";
import { useState } from "react";

export default function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialFile = (location.state as { file?: File } | null)?.file ?? null;

  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const { result, loading, error, run, reset } = useAnalyze();

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  const handleSelect = useCallback(
    (file: File) => {
      setSelectedFile(file);
      reset();
    },
    [reset],
  );

  const handleAnalyze = () => {
    if (selectedFile) {
      run(selectedFile);
    }
  };

  // Navigate to results dashboard when analysis completes
  if (result) {
    navigate("/results/dashboard", { state: { analyzeResult: result } });
  }

  const handleGoHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  if (!previewUrl) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5">
        <p className="mb-4 text-sm text-[#8B95A1]">분석할 이미지를 선택해주세요</p>
        <button
          type="button"
          onClick={handleGoHome}
          className="rounded-2xl bg-[#5B8CFF] px-6 py-3.5 text-sm font-semibold text-white"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-5 py-4 pb-24">
      {/* Face image preview */}
      <div className="w-full">
        <FaceAnalysisView
          previewUrl={previewUrl}
          result={null}
          selectedRegion={null}
          onSelectRegion={() => {}}
        />
      </div>

      {/* Controls */}
      <div className="mt-6 flex w-full flex-col items-center gap-4">
        <ImageUploader onSelect={handleSelect} previewUrl={null} />

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!selectedFile || loading}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#5B8CFF] py-4 text-base font-semibold text-white shadow-[0_4px_16px_rgba(91,140,255,0.3)] disabled:opacity-50 transition-all active:brightness-95"
        >
          {loading ? "분석 중..." : "AI 피부 분석 시작"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 w-full">
          <ErrorAlert message={error} onClose={reset} />
        </div>
      )}

      {/* Go home */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={handleGoHome}
          className="flex items-center gap-2.5 rounded-2xl bg-[#F2F4F6] px-8 py-3.5 text-sm font-medium text-[#4E5968] transition-all active:brightness-95"
        >
          <RotateCcw size={15} />
          홈으로 돌아가기
        </button>
      </div>

      {loading && <AnalysisLoading imageUrl={previewUrl} />}
    </div>
  );
}
