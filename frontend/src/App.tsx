import { useCallback, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { PredictMode } from "./types/api";
import { usePredict } from "./hooks/usePredict";
import Preloader from "./components/common/Preloader";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ImageUploader from "./components/upload/ImageUploader";
import ModeSelector from "./components/upload/ModeSelector";
import AnalyzeButton from "./components/upload/AnalyzeButton";
import ResultsPanel from "./components/results/ResultsPanel";
import ProductRecommendation from "./components/results/ProductRecommendation";
import FaceAnalysisView from "./components/face/FaceAnalysisView";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ErrorAlert from "./components/common/ErrorAlert";

export default function App() {
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<PredictMode>("class");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const { result, loading, error, run, reset } = usePredict();

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  const handleSelect = useCallback(
    (file: File) => {
      setSelectedFile(file);
      setSelectedRegion(null);
      reset();
    },
    [reset],
  );

  const handleAnalyze = () => {
    if (selectedFile) {
      setSelectedRegion(null);
      run(selectedFile, mode);
    }
  };

  const handleGoHome = useCallback(() => {
    setSelectedFile(null);
    setSelectedRegion(null);
    setMode("class");
    reset();
  }, [reset]);

  if (!preloaderDone) {
    return <Preloader onComplete={() => setPreloaderDone(true)} />;
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-dark-950">
      <Header onGoHome={handleGoHome} />

      <main className="relative z-10 w-full flex-1 px-4 py-6">
        {/* Upload state: centered hero */}
        {!previewUrl && (
          <div className="flex min-h-[70vh] flex-col items-center justify-center">
            <div className="animate-float-in w-full max-w-xl text-center">
              {/* Hero text */}
              <h2 className="mb-3 text-2xl font-semibold tracking-tight text-cream-200 sm:text-3xl">
                AI 피부 분석
              </h2>
              <p className="mx-auto mb-4 max-w-md text-sm leading-relaxed text-white/40">
                사진 한 장으로 피부 상태를 확인하세요
              </p>
              <p className="mx-auto mb-10 text-xs text-white/25">
                5개 항목 분석 · 9개 부위 측정 · 무료
              </p>

              <ImageUploader onSelect={handleSelect} previewUrl={previewUrl} />
            </div>
          </div>
        )}

        {/* Analysis state: face view + controls + results */}
        {previewUrl && (
          <div className="animate-float-in flex flex-col items-center">
            {/* Face image + overlay */}
            <div className="w-full">
              <FaceAnalysisView
                previewUrl={previewUrl}
                result={result}
                selectedRegion={selectedRegion}
                onSelectRegion={setSelectedRegion}
              />
            </div>

            {/* Controls row - centered below image */}
            <div className="mt-6 flex w-full flex-col items-center gap-4">
              <ImageUploader onSelect={handleSelect} previewUrl={null} />

              <div className="flex w-full flex-col items-center gap-3">
                <ModeSelector mode={mode} onChange={setMode} />
                <AnalyzeButton
                  onClick={handleAnalyze}
                  loading={loading}
                  disabled={!selectedFile}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 w-full">
                <ErrorAlert message={error} onClose={reset} />
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="mt-8 w-full border-t border-white/5 pt-6">
                <ResultsPanel result={result} selectedRegion={selectedRegion} />

                {/* Product recommendation */}
                <ProductRecommendation result={result} />

                {/* Go home button */}
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={handleGoHome}
                    className="group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-8 py-3.5 text-sm font-light tracking-wide text-white/50 transition-all duration-200 hover:border-rose-400/20 hover:bg-rose-400/[0.04] hover:text-rose-300/80"
                  >
                    <RotateCcw size={15} />
                    새로 분석하기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      {loading && <LoadingSpinner />}
    </div>
  );
}
