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
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <p className="mb-4 text-sm text-white/40">분석할 이미지를 선택해주세요</p>
        <button
          type="button"
          onClick={handleGoHome}
          className="btn-primary rounded-xl px-6 py-3 text-sm font-medium text-white"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="animate-float-in flex flex-col items-center px-4 py-4 pb-24">
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
          className="btn-primary flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-medium text-white shadow-lg shadow-rose-500/15 disabled:opacity-50"
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
          className="group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-8 py-3.5 text-sm font-light tracking-wide text-white/50 transition-all duration-200 hover:border-rose-400/20 hover:bg-rose-400/[0.04] hover:text-rose-300/80"
        >
          <RotateCcw size={15} />
          홈으로 돌아가기
        </button>
      </div>

      {loading && <AnalysisLoading imageUrl={previewUrl} />}
    </div>
  );
}
